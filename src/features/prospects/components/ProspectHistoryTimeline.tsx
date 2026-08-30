"use client";

import { useEffect, useRef } from "react";

import { useTranslation } from "@/contexts/LanguageContext";
import { ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { ProspectHistoryEntry, ProspectStatus } from "@/features/prospects/types";
import { formatDateTime } from "@/lib/format-datetime";

interface ProspectHistoryTimelineProps {
  history: ProspectHistoryEntry[];
  locale: string;
}


function displayHistoryNote(note: string | null) {
  if (!note) return null;
  return note.replace(/\s*\(envelope_id=\d+\)$/, "");
}

export function ProspectHistoryTimeline({ history }: ProspectHistoryTimelineProps) {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // API suele mandar más reciente primero; en horizontal va de viejo → nuevo.
  const chronological = [...history].reverse();

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [chronological.length]);

  if (history.length === 0) {
    return <p className="text-sm text-slate-500">{t("prospects.history.empty")}</p>;
  }

  return (
    <div
      ref={scrollerRef}
      className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-2 [scrollbar-gutter:stable]"
    >
      <ol className="flex min-w-min items-stretch gap-0">
        {chronological.map((entry, index) => (
          <li
            key={entry.id}
            className="relative flex w-[220px] shrink-0 flex-col sm:w-[240px]"
          >
            <div className="mb-3 flex items-center">
              <div
                className={`h-0.5 flex-1 ${index === 0 ? "bg-transparent" : "bg-slate-200"}`}
                aria-hidden
              />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand ring-4 ring-white" />
              <div
                className={`h-0.5 flex-1 ${
                  index === chronological.length - 1 ? "bg-transparent" : "bg-slate-200"
                }`}
                aria-hidden
              />
            </div>

            <div className="mx-1.5 flex flex-1 flex-col rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t(`prospects.history.event.${entry.event_type}` as never)}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400">
                {formatDateTime(entry.created_at)}
              </span>

              {entry.from_status && entry.to_status && entry.from_status !== entry.to_status ? (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <ProspectStatusBadge status={entry.from_status as ProspectStatus} />
                  <span className="text-xs text-slate-400">→</span>
                  <ProspectStatusBadge status={entry.to_status as ProspectStatus} />
                </div>
              ) : null}

              {entry.note ? (
                <p className="mt-2 line-clamp-3 text-xs leading-snug text-slate-700">
                  {displayHistoryNote(entry.note)}
                </p>
              ) : null}

              {entry.changed_by_name ? (
                <p className="mt-auto pt-2 text-[11px] text-slate-500">
                  {t("prospects.history.by", { name: entry.changed_by_name })}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
