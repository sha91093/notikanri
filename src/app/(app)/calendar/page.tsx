"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useYearStore } from "@/lib/stores/yearStore";
import { EventModal } from "@/components/calendar/EventModal";
import { Plus } from "lucide-react";

const FullCalendarComp = dynamic(
  () => import("@/components/calendar/FullCalendarComp"),
  { ssr: false }
);

export default function CalendarPage() {
  const { year } = useYearStore();
  const [events, setEvents] = useState<any[]>([]);
  const [parcels, setParcels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [modalEvent, setModalEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/schedule-events?year=${year}`).then((r) => r.json()),
      fetch("/api/parcels").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([e, p, u]) => {
      setEvents(Array.isArray(e) ? e : []);
      setParcels(Array.isArray(p) ? p : []);
      setUsers(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  }, [year]);

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: e.endDate,
    allDay: e.allDay,
    backgroundColor: e.color ?? "#2d6a4f",
    borderColor: e.color ?? "#2d6a4f",
    extendedProps: e,
  }));

  function handleEventClick(info: any) {
    const ev = info.event.extendedProps;
    setModalEvent({ ...ev, id: info.event.id, startDate: info.event.startStr, endDate: info.event.endStr || info.event.startStr });
    setShowModal(true);
  }

  function handleDateClick(info: any) {
    setModalEvent({ startDate: info.dateStr, endDate: info.dateStr });
    setShowModal(true);
  }

  function handleSaved(saved: any) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    setShowModal(false);
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setShowModal(false);
  }

  return (
    <div className="px-4 py-4 h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-gray-800">{year}年度 営農スケジュール</h1>
        <button
          onClick={() => { setModalEvent(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-[#2d6a4f] text-white px-3 py-2 rounded-xl text-sm font-semibold touch-target"
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">読み込み中...</div>
        ) : (
          <FullCalendarComp
            events={calendarEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {showModal && (
        <EventModal
          event={modalEvent}
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
