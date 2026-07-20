"use client";

import { VscChevronRight } from "react-icons/vsc";

import type { CalendlySalesRep } from "@/features/calendly/types";
import { useTranslation } from "@/contexts/LanguageContext";

interface SalesRepListProps {
  reps: CalendlySalesRep[];
  onSelect: (id: number) => void;
  titleKey?: string;
  hintKey?: string;
  showConnectionStatus?: boolean;
}

function initialsFor(rep: CalendlySalesRep): string {
  const first = rep.first_name?.[0] ?? "";
  const last = rep.last_name?.[0] ?? "";
  const value = `${first}${last}`.trim();
  return value ? value.toUpperCase() : (rep.email?.[0] ?? "?").toUpperCase();
}

export function SalesRepList({
  reps,
  onSelect,
  titleKey = "calendly.salesRepsTitle",
  hintKey = "calendly.salesRepsHint",
  showConnectionStatus = true,
}: SalesRepListProps) {
  const { t } = useTranslation();

  if (reps.length === 0) {
    return (
      <div className="card-flat p-8 text-center text-sm text-slate-500">
        {t("calendly.noSalesReps")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t(titleKey)}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t(hintKey)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reps.map((rep) => (
          <button
            key={rep.id}
            type="button"
            onClick={() => onSelect(rep.id)}
            className="group flex min-h-[9.5rem] flex-col rounded-2xl border border-cream-600 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <div className="flex items-start justify-between gap-3">
              {rep.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={rep.avatar_url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-brand/15"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {initialsFor(rep)}
                </div>
              )}
              <VscChevronRight
                className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand"
                aria-hidden
              />
            </div>

            <div className="mt-4 min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-slate-900">
                {rep.first_name} {rep.last_name}
              </p>
              <p className="mt-1 truncate text-sm text-slate-500">{rep.email}</p>
            </div>

            {showConnectionStatus ? (
              <span
                className={`mt-4 inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  rep.connected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {rep.connected ? t("calendly.connected") : t("calendly.notConnected")}
              </span>
            ) : (
              <span className="mt-4 text-xs font-medium text-slate-400 transition group-hover:text-brand">
                {t("common.view")} →
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
