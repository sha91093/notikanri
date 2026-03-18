"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja";

interface Props {
  events: any[];
  onEventClick: (info: any) => void;
  onDateClick: (info: any) => void;
  weatherMap?: Record<string, string>; // date -> emoji
}

export default function FullCalendarComp({ events, onEventClick, onDateClick, weatherMap = {} }: Props) {
  return (
    <div className="h-full p-2">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={jaLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        events={events}
        eventClick={onEventClick}
        dateClick={onDateClick}
        height="100%"
        dayCellContent={(arg) => {
          const dateStr = arg.date.toISOString().split("T")[0];
          const emoji = weatherMap[dateStr];
          return (
            <div className="flex flex-col items-end gap-0.5 w-full">
              <span>{arg.dayNumberText}</span>
              {emoji && <span className="text-sm leading-none">{emoji}</span>}
            </div>
          );
        }}
      />
    </div>
  );
}
