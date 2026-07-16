"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  CLIENT_SOURCE_LABEL_KEYS,
  CLIENT_SOURCE_VALUES,
  type ClientSourceValue,
} from "@/features/clients/constants";
import { SOURCE_CHART_COLORS } from "@/features/dashboard/constants";
import type { SourceCount } from "@/features/dashboard/types";
import { useTranslation } from "@/contexts/LanguageContext";

const CHART_TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

export function SourceOriginBreakdown({ data }: { data: SourceCount[] }) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const counts = new Map(data.map((item) => [item.source, item.count]));
    return CLIENT_SOURCE_VALUES.map((source) => {
      const count = counts.get(source) ?? 0;
      const labelKey = CLIENT_SOURCE_LABEL_KEYS[source as ClientSourceValue];
      return {
        source,
        name: t(labelKey as never),
        value: count,
      };
    }).filter((item) => item.value > 0);
  }, [data, t]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card-flat overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">
          {t("dashboard.sourceOriginTitle")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{t("dashboard.sourceOriginSubtitle")}</p>
      </div>

      {chartData.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-slate-500">
          {t("dashboard.sourceOriginEmpty")}
        </p>
      ) : (
        <div className="relative px-3 pb-2 pt-4 sm:px-5">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.source} fill={SOURCE_CHART_COLORS[entry.source] ?? "#64748b"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number, name: string) => {
                  const share = total > 0 ? Math.round((value / total) * 100) : 0;
                  return [`${value} (${share}%)`, name];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-slate-900">{total}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {t("dashboard.tableProspects")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-xs text-slate-500">
        {t("dashboard.sourceOriginFooter")}
      </div>
    </div>
  );
}
