"use client";

import { useState } from "react";
import { X, Save, Loader2, Sprout } from "lucide-react";

interface Parcel {
  id: string;
  name: string;
  area: number | null;
}

interface CropPlan {
  parcelId: string;
  crop1: string | null;
  crop2: string | null;
  assignedUser: { id: string; name: string | null } | null;
  note: string | null;
}

interface User {
  id: string;
  name: string | null;
}

interface ParcelPanelProps {
  parcel: Parcel;
  plan: CropPlan | null;
  users: User[];
  year: number;
  onClose: () => void;
  onSaved: (plan: CropPlan) => void;
}

export function ParcelPanel({ parcel, plan, users, year, onClose, onSaved }: ParcelPanelProps) {
  const [crop1, setCrop1] = useState(plan?.crop1 ?? "");
  const [crop2, setCrop2] = useState(plan?.crop2 ?? "");
  const [assignedUserId, setAssignedUserId] = useState(plan?.assignedUser?.id ?? "");
  const [note, setNote] = useState(plan?.note ?? "");
  const [saving, setSaving] = useState(false);

  const COMMON_CROPS = ["水稲", "麦", "大豆", "とうもろこし", "野菜", "果樹", "その他"];

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/crop-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parcelId: parcel.id,
        year,
        crop1: crop1 || null,
        crop2: crop2 || null,
        assignedUserId: assignedUserId || null,
        note: note || null,
      }),
    });
    const saved = await res.json();
    setSaving(false);
    onSaved(saved);
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1000] p-5 max-h-[70vh] overflow-y-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sprout size={20} className="text-[#2d6a4f]" />
          <h2 className="text-lg font-bold text-gray-800">{parcel.name}</h2>
          {parcel.area && (
            <span className="text-sm text-gray-500">{parcel.area.toFixed(2)} ha</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 touch-target"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* 1作目 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            1作目の作物
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_CROPS.map((c) => (
              <button
                key={c}
                onClick={() => setCrop1(c)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  crop1 === c
                    ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                    : "border-gray-300 text-gray-600 hover:border-[#52b788]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={crop1}
            onChange={(e) => setCrop1(e.target.value)}
            placeholder="作物名を入力..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          />
        </div>

        {/* 2作目（二毛作） */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            2作目の作物（二毛作）
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_CROPS.map((c) => (
              <button
                key={c}
                onClick={() => setCrop2(c)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  crop2 === c
                    ? "bg-[#52b788] text-white border-[#52b788]"
                    : "border-gray-300 text-gray-600 hover:border-[#52b788]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={crop2}
            onChange={(e) => setCrop2(e.target.value)}
            placeholder="2作目（任意）"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          />
        </div>

        {/* 担当者 */}
        {users.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              耕作者（担当）
            </label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            >
              <option value="">未設定</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 備考 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">備考</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="メモ..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-base transition-colors touch-target"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" />保存中...</>
          ) : (
            <><Save size={18} />保存する</>
          )}
        </button>
      </div>
    </div>
  );
}
