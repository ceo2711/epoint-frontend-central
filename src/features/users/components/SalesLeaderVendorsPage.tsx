"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useMerchant } from "@/contexts/MerchantContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { AreaMetricsPanel } from "@/features/dashboard/components/DashboardPanels";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";
import { ReassignSubSellerModal } from "@/features/users/components/ReassignSubSellerModal";
import { invalidateStaffDirectoryCaches } from "@/lib/invalidateStaffCaches";
import type { User } from "@/types/api";

function salesRepToUserStub(rep: CalendlySalesRep): User {
  return {
    id: rep.id,
    email: rep.email,
    first_name: rep.first_name,
    last_name: rep.last_name,
    phone: null,
    role: { id: 0, code: rep.parent_user_id ? "SUB_SELLER" : "SALES_REP", name: "" },
    area: null,
    sede_id: null,
    sede: null,
    client_id: null,
    parent_user_id: rep.parent_user_id ?? null,
    is_sub_seller: rep.parent_user_id != null,
    must_change_password: false,
    totp_enabled: false,
    is_active: true,
    last_login_at: null,
    created_at: "",
    avatar_url: null,
  };
}

export function SalesLeaderVendorsPage() {
  const queryClient = useQueryClient();
  const { token, user, hasPermission } = useAuth();
  const { activeMerchantId } = useMerchant();
  const { t } = useTranslation();
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [reassigning, setReassigning] = useState<CalendlySalesRep | null>(null);

  const canViewMetrics = hasPermission("clients:read");
  const roleCode = user?.role.code ?? null;

  const { salesReps, loading: loadingReps, reload: reloadReps } = useSalesReps(token, !!token);

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
  const selectedIsSub = Boolean(selectedRep?.parent_user_id);

  if (selectedRepId != null && selectedRep) {
    return (
      <>
        <Header
          title={t("users.vendorsHeaderContext")}
          subtitle={`${selectedRep.first_name} ${selectedRep.last_name}`}
        />
        <PageContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedRepId(null)}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
            >
              <VscArrowLeft className="h-4 w-4" aria-hidden />
              {t("users.backToVendors")}
            </button>
            {selectedIsSub && token ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setReassigning(selectedRep)}>
                {t("subSellers.reassignAction")}
              </Button>
            ) : null}
          </div>

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

        {reassigning && token ? (
          <ReassignSubSellerModal
            token={token}
            subSeller={salesRepToUserStub(reassigning)}
            onClose={() => setReassigning(null)}
            onSuccess={async () => {
              setReassigning(null);
              setSelectedRepId(null);
              await invalidateStaffDirectoryCaches(queryClient);
              await reloadReps();
            }}
          />
        ) : null}
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
