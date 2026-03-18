"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useYearStore } from "@/lib/stores/yearStore";
import { ParcelPanel } from "@/components/map/ParcelPanel";
import { MapPin, Info } from "lucide-react";

const FarmMap = dynamic(
  () => import("@/components/map/FarmMap").then((m) => m.FarmMap),
  { ssr: false }
);

export default function MapPage() {
  const { year } = useYearStore();
  const [parcels, setParcels] = useState<any[]>([]);
  const [cropPlans, setCropPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/parcels").then((r) => r.json()),
      fetch(`/api/crop-plans?year=${year}`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([p, c, u]) => {
      setParcels(Array.isArray(p) ? p : []);
      setCropPlans(Array.isArray(c) ? c : []);
      setUsers(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  }, [year]);

  function handleParcelSelect(parcel: any, plan: any) {
    setSelectedParcel(parcel);
    setSelectedPlan(plan);
  }

  function handlePlanSaved(plan: any) {
    setCropPlans((prev) => {
      const idx = prev.findIndex((p) => p.parcelId === plan.parcelId && p.year === plan.year);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [...prev, plan];
    });
    setSelectedPlan(plan);
  }

  return (
    <div className="relative h-[calc(100vh-7rem)]">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <MapPin size={32} className="mx-auto mb-2 animate-pulse text-[#2d6a4f]" />
            <p>地図を読み込み中...</p>
          </div>
        </div>
      ) : (
        <>
          <FarmMap
            parcels={parcels}
            cropPlans={cropPlans}
            onParcelSelect={handleParcelSelect}
            selectedParcelId={selectedParcel?.id ?? null}
          />

          {/* 区画なしの場合の案内 */}
          {parcels.length === 0 && (
            <div className="absolute top-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-[1000]">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-[#2d6a4f] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">農地区画がまだありません</p>
                  <p className="text-xs text-gray-500 mt-1">
                    農林水産省の筆ポリゴンデータをインポートするか、管理者にお問い合わせください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 凡例 */}
          <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1">
            <p className="font-bold text-gray-700 mb-1">作物色凡例</p>
            {[
              { label: "水稲", color: "#4CAF50" },
              { label: "麦", color: "#FFC107" },
              { label: "大豆", color: "#8BC34A" },
              { label: "野菜", color: "#FF9800" },
              { label: "果樹", color: "#E91E63" },
              { label: "未設定", color: "#E0E0E0" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm border border-gray-300 shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          {/* 選択区画パネル */}
          {selectedParcel && (
            <ParcelPanel
              parcel={selectedParcel}
              plan={selectedPlan}
              users={users}
              year={year}
              onClose={() => {
                setSelectedParcel(null);
                setSelectedPlan(null);
              }}
              onSaved={handlePlanSaved}
            />
          )}
        </>
      )}
    </div>
  );
}
