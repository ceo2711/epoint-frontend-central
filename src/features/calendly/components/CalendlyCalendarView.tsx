"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";

import type { CalendlyEvent } from "@/features/calendly/types";
import { useTranslation } from "@/contexts/LanguageContext";

interface CalendlyCalendarViewProps {
  events: CalendlyEvent[];
  canManage?: boolean;
  actionsMenu?: ReactNode;
  onSelectEvent?: (event: CalendlyEvent) => void;
  onSelectSlot?: (start: Date) => void;
}

export function CalendlyCalendarView({
  events,
  canManage = false,
  actionsMenu,
  onSelectEvent,
  onSelectSlot,
}: CalendlyCalendarViewProps) {
  const { t, locale } = useTranslation();
  const calendarRef = useRef<HTMLDivElement>(null);
  const actionsHostRef = useRef<HTMLDivElement | null>(null);
  const [actionsMountEl, setActionsMountEl] = useState<HTMLDivElement | null>(null);

  const calendarEvents = events
    .filter((event) => event.status !== "canceled")
    .map((event) => ({
      id: String(event.id),
      title: event.invitee_name ? `${event.invitee_name} · ${event.name}` : event.name,
      start: event.start_time,
      end: event.end_time,
      extendedProps: event,
    }));

  function mountActionsSlot() {
    if (!actionsMenu || !calendarRef.current) return;

    const rightChunk = calendarRef.current.querySelector(
      ".fc-header-toolbar .fc-toolbar-chunk:last-child",
    );
    if (!rightChunk) return;

    if (!actionsHostRef.current) {
      actionsHostRef.current = document.createElement("div");
      actionsHostRef.current.className = "calendly-calendar-actions-slot";
    }

    if (actionsHostRef.current.parentElement !== rightChunk) {
      rightChunk.appendChild(actionsHostRef.current);
    }

    setActionsMountEl(actionsHostRef.current);
  }

  useEffect(() => {
    if (!actionsMenu) {
      actionsHostRef.current?.remove();
      actionsHostRef.current = null;
      setActionsMountEl(null);
      return;
    }

    mountActionsSlot();

    const toolbar = calendarRef.current?.querySelector(".fc-header-toolbar");
    if (!toolbar) return;

    const observer = new MutationObserver(() => mountActionsSlot());
    observer.observe(toolbar, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [actionsMenu]);

  function handleEventClick(arg: EventClickArg) {
    onSelectEvent?.(arg.event.extendedProps as CalendlyEvent);
  }

  function handleSelectSlot(arg: DateSelectArg) {
    if (!canManage) return;
    onSelectSlot?.(arg.start);
    arg.view.calendar.unselect();
  }

  return (
    <div ref={calendarRef} className="calendly-calendar card-flat overflow-hidden p-3 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        locale={locale === "es" ? "es" : "en"}
        height="auto"
        events={calendarEvents}
        eventClick={handleEventClick}
        selectable={canManage}
        selectMirror={canManage}
        select={handleSelectSlot}
        datesSet={mountActionsSlot}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        nowIndicator
        buttonText={{
          today: t("calendly.viewToday"),
          month: t("calendly.viewMonth"),
          week: t("calendly.viewWeek"),
          day: t("calendly.viewDay"),
        }}
      />
      {actionsMenu && actionsMountEl ? createPortal(actionsMenu, actionsMountEl) : null}
    </div>
  );
}
