"use client";

import type { AreaMetrics, DashboardMetrics } from "@/features/dashboard/types";
import { AreaSelectorCards } from "@/features/dashboard/components/AreaSelectorCards";
import {
  ProjectionLineChart,
  StatusBarChart,
  StatusPieChart,
  TrendLineChart,
} from "@/features/dashboard/components/DashboardCharts";
import { MetricReveal } from "@/features/dashboard/components/MetricReveal";
import { SalesCommissionChart } from "@/features/dashboard/components/SalesCommissionChart";
import { InfluencerLeadsRanking } from "@/features/dashboard/components/InfluencerLeadsRanking";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { StatusBreakdownTable } from "@/features/dashboard/components/StatusBreakdownTable";
import { PipelineStageConversion } from "@/features/dashboard/components/PipelineStageConversion";
import { SourceOriginBreakdown } from "@/features/dashboard/components/SourceOriginBreakdown";
import { useTranslation } from "@/contexts/LanguageContext";

export function DashboardAreaHome({
  metrics,
  onSelectArea,
}: {
  metrics: DashboardMetrics;
  onSelectArea: (code: string) => void;
}) {
  const { t } = useTranslation();
  const subtitle =
    metrics.viewer_scope === "personal"
      ? t("dashboard.areasSubtitleSalesRep")
      : metrics.areas.length === 1 && metrics.areas[0]?.code === "ONBOARDING"
        ? t("dashboard.areasSubtitleOnboarding")
        : t("dashboard.areasSubtitle");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.areasTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <AreaSelectorCards areas={metrics.areas} onSelect={onSelectArea} />
    </div>
  );
}

export function AreaMetricsPanel({
  area,
  metrics,
  onBack,
  showBack = true,
  showInfluencerRanking = true,
}: {
  area: AreaMetrics;
  metrics: DashboardMetrics;
  onBack: () => void;
  showBack?: boolean;
  /** En vista de líder el ranking de influencers vive junto al ranking mensual. */
  showInfluencerRanking?: boolean;
}) {
  const { t } = useTranslation();
  const isSales = area.code === "VENTAS";
  const isPersonal = area.scope === "personal";
  const subtitle = t("dashboard.onboardingMetricsSubtitle");
  const showCommission =
    isSales &&
    area.monthly_commission != null &&
    (isPersonal || (area.commission_series?.length ?? 0) > 0);
  const showInfluencer = isSales && showInfluencerRanking;

  return (
    <div className="space-y-6">
      {showBack || !isSales ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
              >
                ← {t("dashboard.backToAreas")}
              </button>
            ) : null}
            <h2 className="text-xl font-bold text-slate-900">{area.name}</h2>
            {!isSales ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}

      {showCommission || showInfluencer ? (
        <div
          className={
            showCommission && showInfluencer
              ? "grid gap-4 xl:grid-cols-2 xl:items-stretch"
              : undefined
          }
        >
          {showCommission ? (
            <MetricReveal delayMs={20}>
              <SalesCommissionChart
                commission={area.monthly_commission ?? 0}
                perSale={area.commission_per_sale ?? 500}
                paidCount={area.monthly_paid_count ?? 0}
                ownCommission={area.own_commission ?? area.monthly_commission ?? 0}
                overrideCommission={area.override_commission ?? 0}
                overridePerSale={area.parent_override_per_sale ?? 250}
                overridePaidCount={area.override_paid_count ?? 0}
                series={area.commission_series ?? []}
              />
            </MetricReveal>
          ) : null}
          {showInfluencer ? (
            <MetricReveal delayMs={40}>
              <InfluencerLeadsRanking data={area.by_influencer ?? []} />
            </MetricReveal>
          ) : null}
        </div>
      ) : null}

      {isSales ? (
        <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
          <MetricReveal delayMs={40}>
            <PipelineStageConversion data={area.by_status} />
          </MetricReveal>
          <MetricReveal delayMs={100}>
            <SourceOriginBreakdown data={area.by_source ?? []} />
          </MetricReveal>
        </div>
      ) : null}

      {!isSales ? (
        <MetricReveal delayMs={40}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title={isPersonal ? t("dashboard.myClientsTotal") : t("dashboard.totalInArea")}
              value={area.total}
              accent="slate"
            />
            <StatCard title={t("dashboard.inPipeline")} value={area.in_pipeline} accent="amber" />
            <StatCard title={t("dashboard.completedClients")} value={area.completed} accent="green" />
          </div>
        </MetricReveal>
      ) : null}

      <MetricReveal delayMs={isSales ? 180 : 120}>
        <div className="grid gap-4 xl:grid-cols-2">
          <StatusPieChart data={area.by_status} title={t("dashboard.statusDistribution")} />
          <StatusBarChart data={area.by_status} title={t("dashboard.statusByCount")} />
        </div>
      </MetricReveal>

      <MetricReveal delayMs={isSales ? 260 : 220}>
        <div className="grid gap-4 xl:grid-cols-2">
          <TrendLineChart
            data={isSales ? (metrics.prospect_registrations ?? []) : metrics.registrations}
            title={
              isSales
                ? isPersonal
                  ? t("dashboard.myProspectsTrend")
                  : t("dashboard.prospectsTrend")
                : t("dashboard.newClientsTrend")
            }
            color={isSales ? "#2563eb" : "#3d6b45"}
          />
          {!isSales ? (
            <TrendLineChart
              data={metrics.completions}
              title={t("dashboard.completionsTrend")}
              color="#059669"
            />
          ) : (
            <ProjectionLineChart
              history={metrics.prospect_registrations ?? []}
              projections={metrics.prospect_registration_projections ?? []}
              title={
                isPersonal ? t("dashboard.myProspectsProjection") : t("dashboard.prospectsProjection")
              }
            />
          )}
        </div>
      </MetricReveal>

      {!isSales ? (
        <MetricReveal delayMs={320}>
          <ProjectionLineChart
            history={metrics.completions}
            projections={metrics.completion_projections}
            title={t("dashboard.completionsProjection")}
          />
        </MetricReveal>
      ) : null}

      {!isSales ? (
        <MetricReveal delayMs={400}>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t("dashboard.statusBreakdown")}
            </h3>
            <StatusBreakdownTable data={area.by_status} />
          </div>
        </MetricReveal>
      ) : null}

      {isSales ? (
        <MetricReveal delayMs={340}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={isPersonal ? t("dashboard.myProspectsTotal") : t("dashboard.totalProspects")}
              value={area.total}
              accent="slate"
            />
            <StatCard
              title={t("dashboard.prospectsInPipeline")}
              value={area.in_pipeline}
              accent="amber"
            />
            <StatCard
              title={t("dashboard.conversion")}
              value={area.conversion_rate ?? 0}
              suffix="%"
              accent="green"
            />
            <StatCard title={t("dashboard.paymentsCompleted")} value={area.completed} accent="blue" />
          </div>
        </MetricReveal>
      ) : null}
    </div>
  );
}
