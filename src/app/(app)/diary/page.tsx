"use client";

import { useEffect, useState } from "react";
import { useYearStore } from "@/lib/stores/yearStore";
import { WorkLogModal } from "@/components/worklog/WorkLogModal";
import { WEATHER_ICONS } from "@/lib/utils";
import { Plus, Search, Image as ImageIcon, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function DiaryPage() {
  const { year } = useYearStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [parcels, setParcels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [modalLog, setModalLog] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterParcel, setFilterParcel] = useState("");
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/work-logs?year=${year}`).then((r) => r.json()),
      fetch("/api/parcels").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([l, p, u]) => {
      setLogs(Array.isArray(l) ? l : []);
      setParcels(Array.isArray(p) ? p : []);
      setUsers(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  }, [year]);

  const filtered = logs.filter((log) => {
    if (filterParcel && log.parcelId !== filterParcel) return false;
    if (filterUser && log.assignedUserId !== filterUser) return false;
    if (search && !log.content.includes(search) && !(log.memo ?? "").includes(search)) return false;
    return true;
  });

  function handleSaved(saved: any) {
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setShowModal(false);
  }

  function handleDeleted(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setShowModal(false);
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{year}年度 作業日誌</h1>
        <button
          onClick={() => { setModalLog(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-[#2d6a4f] text-white px-3 py-2 rounded-xl text-sm font-semibold touch-target"
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {/* 検索・絞り込み */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="作業内容・メモで検索..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] bg-white"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterParcel}
            onChange={(e) => setFilterParcel(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] bg-white"
          >
            <option value="">全農地</option>
            {parcels.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] bg-white"
          >
            <option value="">全担当者</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.id}</option>)}
          </select>
        </div>
      </div>

      {/* 一覧 */}
      {loading ? (
        <div className="text-center text-gray-400 py-10">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <p>日誌がまだありません</p>
          <p className="text-sm mt-1">「追加」ボタンから登録してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <button
              key={log.id}
              onClick={() => { setModalLog(log); setShowModal(true); }}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {log.weather && (
                      <span className="text-lg leading-none">{WEATHER_ICONS[log.weather]}</span>
                    )}
                    <span className="text-sm font-semibold text-gray-800">
                      {format(new Date(log.date), "M月d日(E)", { locale: ja })}
                    </span>
                    {log.parcel && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {log.parcel.name}
                      </span>
                    )}
                  </div>
                  <p className="text-base text-gray-800 font-medium truncate">{log.content}</p>
                  {log.assignedUser && (
                    <p className="text-xs text-gray-400 mt-1">{log.assignedUser.name}</p>
                  )}
                  {log.photos?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <ImageIcon size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{log.photos.length}枚</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <WorkLogModal
          log={modalLog}
          parcels={parcels}
          users={users}
          year={year}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
