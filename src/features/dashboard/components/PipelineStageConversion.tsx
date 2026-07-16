"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";

import { STATUS_CHART_COLORS } from "@/features/dashboard/constants";
import type { StatusCount } from "@/features/dashboard/types";
import {
  buildFunnelStageConversion,
  getConversionHealth,
  type ConversionHealth,
} from "@/features/dashboard/utils/funnelConversion";
import { useTranslation } from "@/contexts/LanguageContext";

const HEALTH_STYLES: Record<ConversionHealth, string> = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  watch: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-slate-50 text-slate-500 ring-slate-200",
};

export function PipelineStageConversion({ data }: { data: StatusCount[] }) {
  const { t } = useTranslation();
  const rows = useMemo(() => buildFunnelStageConversion(data), [data]);

  return (
    <div className="card-flat overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">
          {t("dashboard.stageConversionTitle")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{t("dashboard.stageConversionSubtitle")}</p>
      </div>

      <ul className="divide-y divide-slate-100">
        {rows.map((row, index) => {
          const health = getConversionHealth(row.conversionRate);
          return (
            <li
              key={row.status}
              className="metric-reveal-row flex items-center justify-between gap-4 px-5 py-3.5"
              style={{ "--metric-delay": `${80 + index * 70}ms` } as CSSProperties}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_CHART_COLORS[row.status] ?? "#64748b" }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {t(`prospects.status.${row.status}` as never)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t("dashboard.stageReached", { count: row.reached })}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <span className="tabular-nums text-lg font-bold text-slate-900">{row.count}</span>
                <span
                  className={`inline-flex min-w-[3.25rem] justify-center rounded-lg px-2 py-1 text-sm font-semibold ring-1 ring-inset ${HEALTH_STYLES[health]}`}
                >
                  {row.conversionRate == null ? "—" : `${row.conversionRate}%`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-xs text-slate-500">
        <span>
          <span className="font-semibold text-emerald-700">≥70%</span> {t("dashboard.stageHealthGood")}
        </span>
        <span>
          <span className="font-semibold text-amber-700">50–69%</span>{" "}
          {t("dashboard.stageHealthWatch")}
        </span>
        <span>
          <span className="font-semibold text-red-700">&lt;50%</span>{" "}
          {t("dashboard.stageHealthCritical")}
        </span>
      </div>
    </div>
  );
}
