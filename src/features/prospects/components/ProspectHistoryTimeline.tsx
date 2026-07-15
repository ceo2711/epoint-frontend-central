"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import { ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { ProspectHistoryEntry, ProspectStatus } from "@/features/prospects/types";

interface ProspectHistoryTimelineProps {
  history: ProspectHistoryEntry[];
  locale: string;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ProspectHistoryTimeline({ history, locale }: ProspectHistoryTimelineProps) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return <p className="text-sm text-slate-500">{t("prospects.history.empty")}</p>;
  }

  return (
    <ol className="space-y-4">
      {history.map((entry) => (
        <li key={entry.id} className="relative border-l-2 border-slate-200 pl-4">
          <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(`prospects.history.event.${entry.event_type}` as never)}
            </span>
            <span className="text-xs text-slate-400">{formatDate(entry.created_at, locale)}</span>
          </div>
          {entry.from_status && entry.to_status && entry.from_status !== entry.to_status ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ProspectStatusBadge status={entry.from_status as ProspectStatus} />
              <span className="text-slate-400">→</span>
              <ProspectStatusBadge status={entry.to_status as ProspectStatus} />
            </div>
          ) : null}
          {entry.note ? <p className="mt-2 text-sm text-slate-700">{entry.note}</p> : null}
          {entry.changed_by_name ? (
            <p className="mt-1 text-xs text-slate-500">
              {t("prospects.history.by", { name: entry.changed_by_name })}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
