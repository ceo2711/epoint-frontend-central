"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useMerchant } from "@/contexts/MerchantContext";
import {
  AreaMetricsPanel,
  DashboardAreaHome,
} from "@/features/dashboard/components/DashboardPanels";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";
import type { DashboardAreaCode } from "@/features/dashboard/types";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { SedeBranchList } from "@/features/sedes/components/SedeBranchList";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import { buildSedeBranchesFromReps } from "@/features/sedes/utils/sedeBranches";
import { fetchCalendlySalesReps } from "@/lib/queryFetchers";
import { isGlobalAdmin } from "@/lib/roles";

const AREA_CODES = new Set<DashboardAreaCode>(["ONBOARDING", "VENTAS"]);

function parseAreaCode(value: string | null): DashboardAreaCode | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  return AREA_CODES.has(normalized as DashboardAreaCode) ? (normalized as DashboardAreaCode) : null;
}

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner label={t("dashboard.loadingStats")} />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, hasPermission } = useAuth();
  const { activeMerchantId } = useMerchant();
  const { t } = useTranslation();
  const canViewClients = hasPermission("clients:read");
  const selectedAreaCode = parseAreaCode(searchParams.get("area"));
  const roleCode = user?.role.code ?? null;
  const isGlobal = isGlobalAdmin(roleCode);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [salesReps, setSalesReps] = useState<CalendlySalesRep[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);

  const showSedePicker = isGlobal && selectedSedeId === null;
  const metricsEnabled = canViewClients && (!isGlobal || selectedSedeId != null);

  const { sedes, loading: loadingSedes } = useSedes(
    token,
    isGlobal && hasPermission("sedes:read"),
    t("sedes.loadError"),
    "",
    false,
  );

  useEffect(() => {
    if (!token || !isGlobal) {
      setSalesReps([]);
      return;
    }
    setLoadingReps(true);
    void fetchCalendlySalesReps(token)
      .then(setSalesReps)
      .catch(() => setSalesReps([]))
      .finally(() => setLoadingReps(false));
  }, [token, isGlobal]);

  const branches = useMemo(
    () =>
      buildSedeBranchesFromReps(salesReps, sedes, {
        includeAllSedes: isGlobal,
        fallbackName: t("users.sede"),
      }),
    [salesReps, sedes, isGlobal, t],
  );

  const selectedSede = branches.find((branch) => branch.id === selectedSedeId) ?? null;

  const { metrics, loading, error } = useDashboardMetrics(
    token,
    metricsEnabled,
    activeMerchantId,
    roleCode,
    isGlobal ? selectedSedeId : null,
  );

  const allowedAreaCodes = useMemo(
    () => new Set(metrics?.areas.map((area) => area.code) ?? []),
    [metrics?.areas],
  );

  const singleArea = metrics?.areas.length === 1 ? metrics.areas[0] : null;

  const activeArea = useMemo(() => {
    if (!metrics) return null;
    if (selectedAreaCode && allowedAreaCodes.has(selectedAreaCode)) {
      return metrics.areas.find((area) => area.code === selectedAreaCode) ?? null;
    }
    if (singleArea) return singleArea;
    return null;
  }, [metrics, selectedAreaCode, allowedAreaCodes, singleArea]);

  const setSelectedArea = useCallback(
    (code: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (code) {
        params.set("area", code);
      } else {
        params.delete("area");
      }
      const query = params.toString();
      router.push(query ? `/dashboard?${query}` : "/dashboard");
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!metrics || loading) return;
    if (selectedAreaCode && !allowedAreaCodes.has(selectedAreaCode)) {
      setSelectedArea(null);
    }
  }, [metrics, loading, selectedAreaCode, allowedAreaCodes, setSelectedArea]);

  const showAreaHome =
    metrics &&
    !activeArea &&
    metrics.areas.length > 1 &&
    metrics.viewer_scope !== "personal";
  const showAreaPanel = metrics && activeArea;
  const showSingleAreaDirect = metrics && singleArea && metrics.areas.length === 1;

  const headerTitle = isGlobal ? t("dashboard.adminHeaderContext") : t("dashboard.headerContext");
  const headerSubtitle = isGlobal
    ? t("dashboard.adminPageSubtitleSedes")
    : t("dashboard.subtitle");
  const adminLoading = isGlobal && (loadingReps || loadingSedes);

  function handleBackToSedes() {
    setSelectedSedeId(null);
    setSelectedArea(null);
  }

  return (
    <>
      <Header title={headerTitle} subtitle={headerSubtitle} />
      <PageContent className="space-y-6">
        {!canViewClients ? (
          <div className="card-flat p-6">
            <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.summaryTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("dashboard.summaryBody")}</p>
          </div>
        ) : null}

        {canViewClients && adminLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label={t("dashboard.loadingStats")} />
          </div>
        ) : null}

        {canViewClients && !adminLoading && showSedePicker ? (
          <SedeBranchList
            branches={branches}
            onSelect={setSelectedSedeId}
            titleKey="dashboard.adminSedesTitle"
            hintKey="dashboard.adminSedesSubtitle"
            emptyKey="dashboard.adminSedesEmpty"
            countLabelKey="dashboard.adminSedeRepCount"
          />
        ) : null}

        {canViewClients && !adminLoading && !showSedePicker ? (
          <>
            {isGlobal ? (
              <button
                type="button"
                onClick={handleBackToSedes}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <VscArrowLeft className="h-4 w-4" aria-hidden />
                {t("dashboard.backToSedes")}
              </button>
            ) : null}

            {selectedSede ? (
              <div className="card-flat p-5">
                <h2 className="text-lg font-semibold text-slate-900">{selectedSede.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("dashboard.subtitle")}</p>
              </div>
            ) : null}

            {!activeMerchantId && !loading ? (
              <div className="alert alert-info">{t("dashboard.selectMerchant")}</div>
            ) : null}

            {activeMerchantId && loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner label={t("dashboard.loadingStats")} />
              </div>
            ) : null}

            {activeMerchantId && error && !loading ? (
              <div className="alert alert-error">{t("dashboard.statsError")}</div>
            ) : null}

            {activeMerchantId && metrics && !loading && metrics.areas.length === 0 ? (
              <div className="card-flat p-6">
                <p className="text-sm text-slate-600">{t("dashboard.noAreasForRole")}</p>
              </div>
            ) : null}

            {activeMerchantId && metrics && !loading ? (
              showAreaPanel ? (
                <AreaMetricsPanel
                  area={activeArea!}
                  metrics={metrics}
                  onBack={() => setSelectedArea(null)}
                  showBack={!showSingleAreaDirect}
                />
              ) : showAreaHome ? (
                <DashboardAreaHome metrics={metrics} onSelectArea={setSelectedArea} />
              ) : null
            ) : null}
          </>
        ) : null}
      </PageContent>
    </>
  );
}
