"use client";

import type { AreaMetrics, DashboardMetrics } from "@/features/dashboard/types";
import { AreaSelectorCards } from "@/features/dashboard/components/AreaSelectorCards";
import {
  ProjectionLineChart,
  StatusBarChart,
  StatusPieChart,
  TrendLineChart,
} from "@/features/dashboard/components/DashboardCharts";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { StatusBreakdownTable } from "@/features/dashboard/components/StatusBreakdownTable";
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
}: {
  area: AreaMetrics;
  metrics: DashboardMetrics;
  onBack: () => void;
  showBack?: boolean;
}) {
  const { t } = useTranslation();
  const isSales = area.code === "VENTAS";
  const isPersonal = area.scope === "personal";

  const subtitle = isSales
    ? isPersonal
      ? t("dashboard.salesMetricsSubtitlePersonal")
      : t("dashboard.salesMetricsSubtitle")
    : t("dashboard.onboardingMetricsSubtitle");

  return (
    <div className="space-y-6">
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
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title={isPersonal ? t("dashboard.myClientsTotal") : t("dashboard.totalInArea")}
          value={area.total}
          accent="slate"
        />
        <StatCard
          title={isSales ? t("dashboard.pendingPipeline") : t("dashboard.inPipeline")}
          value={area.in_pipeline}
          accent="amber"
        />
        {isSales ? (
          <StatCard
            title={t("dashboard.conversion")}
            value={area.conversion_rate ?? 0}
            suffix="%"
            accent="green"
          />
        ) : (
          <StatCard title={t("dashboard.completedClients")} value={area.completed} accent="green" />
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StatusPieChart data={area.by_status} title={t("dashboard.statusDistribution")} />
        <StatusBarChart data={area.by_status} title={t("dashboard.statusByCount")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendLineChart
          data={metrics.registrations}
          title={
            isSales
              ? isPersonal
                ? t("dashboard.myRegistrationsTrend")
                : t("dashboard.registrationsTrend")
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
            history={metrics.registrations}
            projections={metrics.registration_projections}
            title={
              isPersonal ? t("dashboard.myRegistrationsProjection") : t("dashboard.registrationsProjection")
            }
          />
        )}
      </div>

      {!isSales ? (
        <ProjectionLineChart
          history={metrics.completions}
          projections={metrics.completion_projections}
          title={t("dashboard.completionsProjection")}
        />
      ) : null}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("dashboard.statusBreakdown")}
        </h3>
        <StatusBreakdownTable data={area.by_status} />
      </div>
    </div>
  );
}
