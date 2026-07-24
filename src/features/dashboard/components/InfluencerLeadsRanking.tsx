"use client";

import { useMemo } from "react";

import { useTranslation } from "@/contexts/LanguageContext";
import type { InfluencerLeadCount } from "@/features/dashboard/types";

const BAR_COLORS = ["#3d6b45", "#4a7c52", "#5a8f62", "#c4a574", "#94a3b8"];

type InfluencerLeadsRankingProps = {
  data: InfluencerLeadCount[];
};

export function InfluencerLeadsRanking({ data }: InfluencerLeadsRankingProps) {
  const { t } = useTranslation();

  const ranked = useMemo(
    () => [...data].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [data],
  );

  const maxCount = ranked[0]?.count ?? 0;
  const totalLeads = ranked.reduce((sum, item) => sum + item.count, 0);
  const totalConverted = ranked.reduce((sum, item) => sum + item.converted_count, 0);

  return (
    <div className="card-flat flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--border-soft)] bg-gradient-to-br from-[#c4a574]/[0.12] via-transparent to-[#3d6b45]/[0.08] px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t("dashboard.influencerRankingTitle")}
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-5xl">
          {totalLeads}
        </p>
        <p className="mt-2 text-sm text-slate-600">{t("dashboard.influencerRankingSubtitle")}</p>
        {totalConverted > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            {t("dashboard.influencerRankingConverted", { count: totalConverted })}
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-5 py-4 sm:px-6">
        {ranked.length === 0 ? (
          <p className="flex flex-1 items-center justify-center py-12 text-center text-sm text-slate-500">
            {t("dashboard.influencerRankingEmpty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {ranked.map((item, index) => {
              const share = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
              const barColor = BAR_COLORS[Math.min(index, BAR_COLORS.length - 1)];
              return (
                <li key={item.influencer_id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        <span className="mr-2 tabular-nums text-slate-400">{index + 1}.</span>
                        {item.name}
                      </p>
                      {item.handle ? (
                        <p className="truncate text-xs text-slate-500">@{item.handle.replace(/^@/, "")}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-slate-900">{item.count}</p>
                      {item.converted_count > 0 ? (
                        <p className="text-[11px] tabular-nums text-slate-500">
                          {t("dashboard.influencerRankingConvertedShort", {
                            count: item.converted_count,
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${share}%`, backgroundColor: barColor }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-auto border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-xs text-slate-500">
        {t("dashboard.influencerRankingFooter")}
      </div>
    </div>
  );
}
