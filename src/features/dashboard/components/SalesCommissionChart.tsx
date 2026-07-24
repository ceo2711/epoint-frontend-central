"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTranslation } from "@/contexts/LanguageContext";
import type { CommissionDayPoint } from "@/features/dashboard/types";

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

type SalesCommissionChartProps = {
  commission: number;
  perSale: number;
  paidCount: number;
  series: CommissionDayPoint[];
};

export function SalesCommissionChart({
  commission,
  perSale,
  paidCount,
  series,
}: SalesCommissionChartProps) {
  const { t } = useTranslation();
  const monthLabel = series[0] ? formatMonthLabel(series[0].date) : "";
  const perSaleLabel = formatUsd(perSale);

  const chartData = useMemo(
    () =>
      series.map((point) => ({
        ...point,
        label: formatShortDate(point.date),
      })),
    [series],
  );

  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);
  const todayDaily =
    series.find((point) => point.date === todayIso)?.daily_commission ?? 0;

  return (
    <div className="card-flat overflow-hidden">
      <div className="border-b border-[var(--border-soft)] bg-gradient-to-br from-[#3d6b45]/[0.08] via-transparent to-[#c4a574]/[0.12] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.monthlyCommissionTitle")}
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-5xl">
              {formatUsd(commission)}
            </p>
            <p className="mt-2 text-sm capitalize text-slate-600">{monthLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#3d6b45]/10 px-2.5 py-1 text-xs font-semibold text-[#3d6b45]">
              {t("dashboard.commissionPerSaleBadge", { amount: perSaleLabel })}
            </span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {t("dashboard.commissionToday", { amount: formatUsd(todayDaily) })}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {t("dashboard.monthlyCommissionHint", { amount: perSaleLabel, count: paidCount })}
        </p>
      </div>

      <div className="px-2 pb-4 pt-4 sm:px-4 sm:pb-5">
        {chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">{t("dashboard.commissionEmpty")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="commissionCumulativeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3d6b45" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#3d6b45" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={28} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `$${Number(value).toFixed(0)}`}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, name) => [
                  formatUsd(Number(value ?? 0)),
                  name === "cumulative_commission"
                    ? t("dashboard.commissionCumulative")
                    : t("dashboard.commissionDaily"),
                ]}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as { date?: string } | undefined;
                  return point?.date ? formatShortDate(point.date) : "";
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "cumulative_commission"
                    ? t("dashboard.commissionCumulative")
                    : t("dashboard.commissionDaily")
                }
              />
              <Area
                type="monotone"
                dataKey="cumulative_commission"
                name="cumulative_commission"
                stroke="#3d6b45"
                strokeWidth={2.5}
                fill="url(#commissionCumulativeFill)"
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="daily_commission"
                name="daily_commission"
                stroke="#c4a574"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "#c4a574" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
