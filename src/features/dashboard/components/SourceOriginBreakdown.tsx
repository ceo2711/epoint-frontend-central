"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { clientSourceLabelKey } from "@/features/clients/constants";
import { SOURCE_CHART_COLORS } from "@/features/dashboard/constants";
import type { SourceCount } from "@/features/dashboard/types";
import { useTranslation } from "@/contexts/LanguageContext";

const CHART_TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

const FALLBACK_COLORS = ["#0ea5e9", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#f59e0b", "#f43f5e", "#64748b"];

export function SourceOriginBreakdown({ data }: { data: SourceCount[] }) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    return data
      .filter((item) => item.count > 0)
      .map((item) => {
        const labelKey = clientSourceLabelKey(item.source);
        return {
          source: item.source,
          name: labelKey ? t(labelKey as never) : item.source,
          value: item.count,
        };
      });
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
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.source}
                    fill={SOURCE_CHART_COLORS[entry.source] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value, name) => {
                  const num = typeof value === "number" ? value : Number(value) || 0;
                  const share = total > 0 ? Math.round((num / total) * 100) : 0;
                  return [`${num} (${share}%)`, String(name ?? "")];
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
