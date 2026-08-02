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

  const {
    metrics: repMetrics,
    loading: loadingRep,
    error: repError,
  } = useDashboardMetrics(
    token,
    canViewMetrics && selectedRepId != null,
    activeMerchantId,
    roleCode,
    null,
    selectedRepId,
  );

  const repSalesArea = repMetrics?.areas.find((area) => area.code === "VENTAS") ?? null;

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
      <PageContent>
        {loadingReps ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <SalesRepList
            reps={salesReps}
            onSelect={setSelectedRepId}
            titleKey="users.vendorsListTitle"
            hintKey="users.vendorsListHint"
            showConnectionStatus={false}
          />
        )}
      </PageContent>
    </>
  );
}
