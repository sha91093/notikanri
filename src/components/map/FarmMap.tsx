"use client";

import { useEffect, useRef } from "react";
import { getCropColor } from "@/lib/utils";

interface Parcel {
  id: string;
  name: string;
  area: number | null;
  geometry: any;
}

interface CropPlan {
  parcelId: string;
  crop1: string | null;
  crop2: string | null;
  assignedUser: { id: string; name: string | null } | null;
  note: string | null;
}

interface FarmMapProps {
  parcels: Parcel[];
  cropPlans: CropPlan[];
  onParcelSelect: (parcel: Parcel, plan: CropPlan | null) => void;
  selectedParcelId: string | null;
}

export function FarmMap({ parcels, cropPlans, onParcelSelect, selectedParcelId }: FarmMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // デフォルトアイコンの修正
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [35.6762, 139.6503],
        zoom: 14,
        zoomControl: true,
      });

      // 国土地理院 航空写真タイル
      L.tileLayer(
        "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
        {
          attribution:
            '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
          maxZoom: 18,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 区画レイヤーの追加・更新
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;

    const updateLayers = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      // 既存レイヤーを削除
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current.clear();

      if (parcels.length === 0) return;

      const bounds: any[] = [];

      parcels.forEach((parcel) => {
        const plan = cropPlans.find((p) => p.parcelId === parcel.id) ?? null;
        const color = getCropColor(plan?.crop1);
        const isSelected = parcel.id === selectedParcelId;

        let layer: any;
        try {
          layer = L.geoJSON(parcel.geometry, {
            style: {
              color: isSelected ? "#ff6b35" : "#2d6a4f",
              weight: isSelected ? 3 : 2,
              fillColor: color,
              fillOpacity: isSelected ? 0.7 : 0.5,
            },
          });
        } catch {
          return;
        }

        layer.on("click", () => onParcelSelect(parcel, plan));

        // ラベル
        const center = layer.getBounds().getCenter();
        const label = L.divIcon({
          className: "farm-label",
          html: `<div style="background:rgba(255,255,255,0.85);border-radius:4px;padding:2px 6px;font-size:12px;font-weight:600;white-space:nowrap;border:1px solid #ddd">${parcel.name}${plan?.crop1 ? `<br><span style="color:#2d6a4f">${plan.crop1}</span>` : ""}</div>`,
          iconAnchor: [0, 0],
        });
        L.marker(center, { icon: label }).addTo(map);

        layer.addTo(map);
        layersRef.current.set(parcel.id, layer);
        bounds.push(...layer.getBounds().toGeoJSON ? [layer.getBounds()] : []);
      });

      if (parcels.length > 0 && layersRef.current.size > 0) {
        try {
          const allBounds = Array.from(layersRef.current.values())
            .map((l) => l.getBounds())
            .filter(Boolean);
          if (allBounds.length > 0) {
            const combined = allBounds.reduce((acc, b) => acc.extend(b));
            map.fitBounds(combined, { padding: [20, 20] });
          }
        } catch {}
      }
    };

    updateLayers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcels, cropPlans, selectedParcelId]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}
