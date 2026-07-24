"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTranslation } from "@/contexts/LanguageContext";
import { InfluencerLeadsRanking } from "@/features/dashboard/components/InfluencerLeadsRanking";
import { MetricReveal } from "@/features/dashboard/components/MetricReveal";
import type { InfluencerLeadCount, SalesLeadershipMetrics } from "@/features/dashboard/types";

const WEEKDAY_KEYS = [
  "dashboard.weekday.mon",
  "dashboard.weekday.tue",
  "dashboard.weekday.wed",
  "dashboard.weekday.thu",
  "dashboard.weekday.fri",
  "dashboard.weekday.sat",
  "dashboard.weekday.sun",
] as const;

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

export function SalesLeadershipPanel({
  leadership,
  byInfluencer = [],
}: {
  leadership: SalesLeadershipMetrics;
  byInfluencer?: InfluencerLeadCount[];
}) {
  const { t } = useTranslation();
  const bestLabel =
    leadership.best_weekday != null ? t(WEEKDAY_KEYS[leadership.best_weekday]) : t("common.dash");

  const chartData = leadership.weekday_sales.map((point) => ({
    ...point,
    label: t(WEEKDAY_KEYS[point.weekday]),
    isBest: point.weekday === leadership.best_weekday && leadership.best_weekday_paid_count > 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.leadershipTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("dashboard.leadershipSubtitle")}</p>
      </div>

      <MetricReveal delayMs={20}>
        <div className="card-flat overflow-hidden">
          <div className="border-b border-[var(--border-soft)] px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dashboard.leadershipWeekdayTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {leadership.best_weekday != null && leadership.best_weekday_paid_count > 0
                ? t("dashboard.leadershipWeekdayHint", {
                    day: bestLabel,
                    count: leadership.best_weekday_paid_count,
                    amount: formatUsd(leadership.best_weekday_paid_amount),
                  })
                : t("dashboard.leadershipWeekdayEmpty")}
            </p>
          </div>
          <div className="px-2 pb-4 pt-4 sm:px-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, _name, item) => {
                    const payload = item?.payload as { paid_amount?: number } | undefined;
                    return [
                      `${Number(value ?? 0)} · ${formatUsd(payload?.paid_amount ?? 0)}`,
                      t("dashboard.leadershipWeekdayBar"),
                    ];
                  }}
                />
                <Bar dataKey="paid_count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.weekday}
                      fill={entry.isBest ? "#3d6b45" : "#c4a574"}
                      fillOpacity={entry.isBest ? 1 : 0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </MetricReveal>

      <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
        <MetricReveal delayMs={140}>
          <div className="card-flat flex h-full flex-col overflow-hidden">
            <div className="border-b border-[var(--border-soft)] px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("dashboard.leadershipLeaderboardTitle")}
              </p>
              <p className="mt-1 text-sm text-slate-600">{t("dashboard.leadershipLeaderboardHint")}</p>
            </div>
            {leadership.leaderboard.length === 0 ? (
              <p className="flex flex-1 items-center justify-center px-5 py-12 text-center text-sm text-slate-500">
                {t("dashboard.leadershipLeaderboardEmpty")}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {leadership.leaderboard.map((row, index) => (
                  <div
                    key={row.user_id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {row.first_name} {row.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t("dashboard.leadershipLeaderboardSales", { count: row.paid_count })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatUsd(row.commission)}
                      </p>
                      <p className="text-xs text-slate-500">{formatUsd(row.paid_amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MetricReveal>

        <MetricReveal delayMs={180}>
          <InfluencerLeadsRanking data={byInfluencer} />
        </MetricReveal>
      </div>
    </div>
  );
}
