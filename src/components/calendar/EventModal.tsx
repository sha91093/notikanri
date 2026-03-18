"use client";

import { useState } from "react";
import { X, Trash2, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Parcel {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
}

interface EventData {
  id?: string;
  title: string;
  parcelId: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  assignedUserId: string;
  memo: string;
  color: string;
}

interface EventModalProps {
  event: Partial<EventData> | null;
  parcels: Parcel[];
  users: User[];
  year: number;
  onClose: () => void;
  onSaved: (event: any) => void;
  onDeleted?: (id: string) => void;
}

const WORK_TYPES = ["耕起", "播種", "施肥", "防除", "草刈り", "収穫", "その他"];
const COLORS = [
  { label: "緑", value: "#2d6a4f" },
  { label: "青", value: "#1565c0" },
  { label: "橙", value: "#e65100" },
  { label: "紫", value: "#6a1b9a" },
  { label: "赤", value: "#c62828" },
];

export function EventModal({ event, parcels, users, year, onClose, onSaved, onDeleted }: EventModalProps) {
  const isEdit = !!event?.id;
  const [title, setTitle] = useState(event?.title ?? "");
  const [parcelId, setParcelId] = useState(event?.parcelId ?? "");
  const [startDate, setStartDate] = useState(
    event?.startDate ? event.startDate.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? event.endDate.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  const [allDay] = useState(event?.allDay ?? true);
  const [assignedUserId, setAssignedUserId] = useState(event?.assignedUserId ?? "");
  const [memo, setMemo] = useState(event?.memo ?? "");
  const [color, setColor] = useState(event?.color ?? "#2d6a4f");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const body = { title, parcelId: parcelId || null, startDate, endDate, allDay, assignedUserId: assignedUserId || null, memo: memo || null, color, year };

    const res = isEdit
      ? await fetch(`/api/schedule-events/${event!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/schedule-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    const saved = await res.json();
    setSaving(false);
    onSaved(saved);
  }

  async function handleDelete() {
    if (!event?.id) return;
    setDeleting(true);
    await fetch(`/api/schedule-events/${event.id}`, { method: "DELETE" });
    setDeleting(false);
    onDeleted?.(event.id);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? "作業を編集" : "作業を追加"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 touch-target">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 作業名 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">作業名 *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {WORK_TYPES.map((w) => (
                <button
                  key={w}
                  onClick={() => setTitle(w)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    title === w ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "border-gray-300 text-gray-600"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="作業名を入力"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* 対象農地 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">対象農地</label>
            <select
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            >
              <option value="">未指定</option>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 日付 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">終了日</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>
          </div>

          {/* 担当者 */}
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">担当者</label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              >
                <option value="">未設定</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name ?? u.id}</option>
                ))}
              </select>
            </div>
          )}

          {/* 色 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">色</label>
            <div className="flex gap-2">
              {COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setColor(value)}
                  title={label}
                  className={`w-8 h-8 rounded-full border-4 transition-all touch-target ${
                    color === value ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="メモ..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200 touch-target"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                削除
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-base transition-colors touch-target"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isEdit ? "更新する" : "登録する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
