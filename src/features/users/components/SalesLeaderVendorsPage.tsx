"use client";

import { useMemo, useState } from "react";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useMerchant } from "@/contexts/MerchantContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import { AreaMetricsPanel } from "@/features/dashboard/components/DashboardPanels";
import { SalesLeadershipPanel } from "@/features/dashboard/components/SalesLeadershipPanel";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";

export function SalesLeaderVendorsPage() {
  const { token, user, hasPermission } = useAuth();
  const { activeMerchantId } = useMerchant();
  const { t } = useTranslation();
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);

  const canViewMetrics = hasPermission("clients:read");
  const roleCode = user?.role.code ?? null;

  const { salesReps, loading: loadingReps } = useSalesReps(token, !!token);

  const selectedRep = useMemo(
    () => salesReps.find((rep) => rep.id === selectedRepId) ?? null,
    [salesReps, selectedRepId],
  );

  const teamEnabled = canViewMetrics && selectedRepId == null;
  const repEnabled = canViewMetrics && selectedRepId != null;

  const {
    metrics: teamMetrics,
    loading: loadingTeam,
    error: teamError,
  } = useDashboardMetrics(token, teamEnabled, activeMerchantId, roleCode, null, null);

  const {
    metrics: repMetrics,
    loading: loadingRep,
    error: repError,
  } = useDashboardMetrics(
    token,
    repEnabled,
    activeMerchantId,
    roleCode,
    null,
    selectedRepId,
  );

  const teamSalesArea = teamMetrics?.areas.find((area) => area.code === "VENTAS") ?? null;
  const repSalesArea = repMetrics?.areas.find((area) => area.code === "VENTAS") ?? null;
  const leadership = teamMetrics?.sales_leadership ?? null;

  if (selectedRepId != null && selectedRep) {
    return (
      <>
        <Header
          title={t("users.vendorsHeaderContext")}
          subtitle={`${selectedRep.first_name} ${selectedRep.last_name}`}
        />
        <PageContent>
          <button
            type="button"
            onClick={() => setSelectedRepId(null)}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
          >
            <VscArrowLeft className="h-4 w-4" aria-hidden />
            {t("users.backToVendors")}
          </button>

          {loadingRep ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : null}

          {repError ? <div className="alert alert-error">{t("dashboard.statsError")}</div> : null}

          {!loadingRep && !repError && repMetrics && repSalesArea ? (
            <AreaMetricsPanel
              area={repSalesArea}
              metrics={repMetrics}
              onBack={() => setSelectedRepId(null)}
              showBack={false}
            />
          ) : null}
        </PageContent>
      </>
    );
  }

  return (
    <>
      <Header title={t("users.vendorsHeaderContext")} subtitle={t("users.vendorsTeamSubtitle")} />
      <PageContent className="space-y-8">
        {!activeMerchantId ? (
          <div className="alert alert-info">{t("dashboard.selectMerchant")}</div>
        ) : null}

        {activeMerchantId && (loadingTeam || loadingReps) ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner label={t("dashboard.loadingStats")} />
          </div>
        ) : null}

        {activeMerchantId && teamError && !loadingTeam ? (
          <div className="alert alert-error">{t("dashboard.statsError")}</div>
        ) : null}

        {activeMerchantId && !loadingTeam && teamMetrics ? (
          <>
            {leadership ? <SalesLeadershipPanel leadership={leadership} /> : null}

            {teamSalesArea ? (
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("dashboard.leadershipFunnelTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{t("dashboard.leadershipFunnelHint")}</p>
                </div>
                <AreaMetricsPanel
                  area={teamSalesArea}
                  metrics={teamMetrics}
                  onBack={() => undefined}
                  showBack={false}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {!loadingReps ? (
          <SalesRepList
            reps={salesReps}
            onSelect={setSelectedRepId}
            titleKey="users.vendorsListTitle"
            hintKey="users.vendorsListHint"
            showConnectionStatus={false}
          />
        ) : null}
      </PageContent>
    </>
  );
}
