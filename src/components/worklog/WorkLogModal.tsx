"use client";

import { useState, useRef } from "react";
import { X, Trash2, Save, Loader2, Camera } from "lucide-react";
import { format } from "date-fns";
import { WEATHER_LABELS, WEATHER_ICONS } from "@/lib/utils";

const WEATHER_OPTIONS = ["SUNNY", "PARTLY_CLOUDY", "CLOUDY", "RAINY", "SNOWY"] as const;

interface Parcel { id: string; name: string }
interface User { id: string; name: string | null }

interface WorkLogData {
  id?: string;
  date: string;
  parcelId: string;
  content: string;
  weather: string;
  assignedUserId: string;
  memo: string;
  photos: { id: string; url: string }[];
  year: number;
}

interface WorkLogModalProps {
  log: Partial<WorkLogData> | null;
  parcels: Parcel[];
  users: User[];
  year: number;
  onClose: () => void;
  onSaved: (log: any) => void;
  onDeleted?: (id: string) => void;
}

export function WorkLogModal({ log, parcels, users, year, onClose, onSaved, onDeleted }: WorkLogModalProps) {
  const isEdit = !!log?.id;
  const [date, setDate] = useState(log?.date?.slice(0, 10) ?? format(new Date(), "yyyy-MM-dd"));
  const [parcelId, setParcelId] = useState(log?.parcelId ?? "");
  const [content, setContent] = useState(log?.content ?? "");
  const [weather, setWeather] = useState(log?.weather ?? "");
  const [assignedUserId, setAssignedUserId] = useState(log?.assignedUserId ?? "");
  const [memo, setMemo] = useState(log?.memo ?? "");
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>(log?.photos ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [savedId, setSavedId] = useState(log?.id ?? "");

  const WORK_CONTENTS = ["耕起", "播種", "施肥", "防除・農薬散布", "草刈り", "灌水", "収穫", "出荷", "その他"];

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);

    const body = { date, parcelId: parcelId || null, content, weather: weather || null, assignedUserId: assignedUserId || null, memo: memo || null, year };

    const res = isEdit
      ? await fetch(`/api/work-logs/${log!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/work-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    const saved = await res.json();
    setSavedId(saved.id);
    setSaving(false);
    onSaved({ ...saved, photos });
  }

  async function handleDelete() {
    if (!log?.id) return;
    setDeleting(true);
    await fetch(`/api/work-logs/${log.id}`, { method: "DELETE" });
    setDeleting(false);
    onDeleted?.(log.id);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // 先に日誌を保存してIDを取得
    let logId = savedId;
    if (!logId) {
      const body = { date, parcelId: parcelId || null, content: content || "（写真のみ）", weather: weather || null, assignedUserId: assignedUserId || null, year };
      const res = await fetch("/api/work-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const saved = await res.json();
      logId = saved.id;
      setSavedId(logId);
    }

    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("workLogId", logId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const photo = await res.json();
        setPhotos((prev) => [...prev, photo]);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? "日誌を編集" : "日誌を追加"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 touch-target"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* 作業日 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">作業日 *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* 天気 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">天気</label>
            <div className="flex gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w}
                  onClick={() => setWeather(weather === w ? "" : w)}
                  className={`flex-1 flex flex-col items-center py-2 rounded-xl border transition-colors text-lg ${
                    weather === w ? "border-[#2d6a4f] bg-green-50" : "border-gray-200"
                  }`}
                >
                  <span>{WEATHER_ICONS[w]}</span>
                  <span className="text-xs text-gray-600 mt-0.5">{WEATHER_LABELS[w]}</span>
                </button>
              ))}
            </div>
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
              {parcels.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* 作業内容 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">作業内容 *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {WORK_CONTENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setContent(c)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    content === c ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "border-gray-300 text-gray-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              placeholder="作業内容を入力..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
            />
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
                {users.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.id}</option>)}
              </select>
            </div>
          )}

          {/* メモ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">自由メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="気づき・メモ..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none"
            />
          </div>

          {/* 写真 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">写真</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="作業写真"
                  className="w-full aspect-square object-cover rounded-xl"
                />
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-colors touch-target"
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={20} />
                    <span className="text-xs">追加</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
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
              disabled={saving || !content.trim()}
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
