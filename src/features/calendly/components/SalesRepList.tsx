"use client";

import { VscChevronRight } from "react-icons/vsc";

import type { CalendlySalesRep } from "@/features/calendly/types";
import { useTranslation } from "@/contexts/LanguageContext";

interface SalesRepListProps {
  reps: CalendlySalesRep[];
  onSelect: (id: number) => void;
}

export function SalesRepList({ reps, onSelect }: SalesRepListProps) {
  const { t } = useTranslation();

  if (reps.length === 0) {
    return (
      <div className="card-flat p-8 text-center text-sm text-slate-500">
        {t("calendly.noSalesReps")}
      </div>
    );
  }

  return (
    <div className="card-flat overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("calendly.salesRepsTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t("calendly.salesRepsHint")}</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {reps.map((rep) => (
          <li key={rep.id}>
            <button
              type="button"
              onClick={() => onSelect(rep.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">
                  {rep.first_name} {rep.last_name}
                </p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{rep.email}</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    rep.connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {rep.connected ? t("calendly.connected") : t("calendly.notConnected")}
                </span>
              </div>
              <VscChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
