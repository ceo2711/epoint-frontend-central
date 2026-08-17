"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HiOutlineTrash } from "react-icons/hi2";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useMerchant } from "@/contexts/MerchantContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ClientListFilters,
  type ClientMerchantFilter,
} from "@/features/clients/components/ClientListFilters";
import { ClientList } from "@/features/clients/components/ClientList";
import { OnboardingRemindersButton } from "@/features/clients/components/OnboardingRemindersButton";
import { useClientWorkflow } from "@/features/clients/hooks/useClientWorkflow";
import { CLIENTS_PAGE_SIZE, useClients } from "@/features/clients/hooks/useClients";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import { SedeBranchList } from "@/features/sedes/components/SedeBranchList";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import {
  buildSedeBranchesFromReps,
  filterRepsBySede,
} from "@/features/sedes/utils/sedeBranches";
import { onClientsRefresh } from "@/lib/clientEvents";
import { clientsListPath, parseSedeIdParam } from "@/lib/clientsNavigation";
import {
  canFilterClientsBySalesRep,
  canRunOnboardingReminders,
  isAdvisor,
  isGlobalAdmin,
  isSedeAdmin,
  seesOnboardingDashboard,
} from "@/lib/roles";

export function ClientesPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner label={t("clients.loading")} />
        </div>
      }
    >
      <ClientesPageContent />
    </Suspense>
  );
}

function ClientesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
  const { merchants: workspaceMerchants, activeMerchantId } = useMerchant();
  const { t } = useTranslation();
  const roleCode = user?.role.code;
  const sedeAdmin = isSedeAdmin(roleCode);
  const canFilterBySalesRep = canFilterClientsBySalesRep(user);
  const lineAdvisor = isAdvisor(user);
  const onboardingStaff = seesOnboardingDashboard(user) && !lineAdvisor;
  const isGlobal = isGlobalAdmin(roleCode);
  const clientsSubtitle = lineAdvisor
    ? t("clients.subtitleAdvisor")
    : onboardingStaff
      ? t("clients.subtitleOnboarding")
      : t("clients.subtitle");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState<ClientMerchantFilter>("all");
  const [salesRepId, setSalesRepId] = useState<number | null>(null);
  const sedeFromUrl = isGlobal ? parseSedeIdParam(searchParams.get("sede")) : null;
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(sedeFromUrl);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedSedeId(sedeFromUrl);
  }, [sedeFromUrl]);

  const showMerchantFilter = workspaceMerchants.length > 1;
  const showSalesRepFilter = canFilterBySalesRep;
  const showAdvisorColumn = roleCode === "SALES_REP" || roleCode === "SUB_SELLER" || canFilterBySalesRep;
  const canBulkDelete = sedeAdmin && hasPermission("clients:delete");
  const showSedePicker = isGlobal && selectedSedeId === null;
  const listEnabled = !isGlobal || selectedSedeId != null;
  const onboardingOnly = roleCode === "BRANCH_MANAGER" || onboardingStaff;

  const { sedes, loading: loadingSedes } = useSedes(
    token,
    isGlobal && hasPermission("sedes:read"),
    t("sedes.loadError"),
    "",
    false,
  );

  const { salesReps, loading: loadingReps } = useSalesReps(token, showSalesRepFilter);

  const branches = useMemo(
    () =>
      buildSedeBranchesFromReps(salesReps, sedes, {
        includeAllSedes: isGlobal,
        fallbackName: t("users.sede"),
      }),
    [salesReps, sedes, isGlobal, t],
  );

  const repsForSede = useMemo(
    () =>
      filterRepsBySede(salesReps, selectedSedeId, {
        filterBySede: isGlobal,
      }),
    [salesReps, selectedSedeId, isGlobal],
  );

  const selectedSede = branches.find((branch) => branch.id === selectedSedeId) ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, merchantFilter, salesRepId, selectedSedeId]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedSearch, merchantFilter, salesRepId, selectedSedeId]);

  useEffect(() => {
    setSalesRepId(null);
  }, [selectedSedeId]);

  useEffect(() => {
    return onClientsRefresh((detail) => {
      setPage(1);
      setSelectedIds([]);
      if (detail?.showAllMerchants && showMerchantFilter) {
        setMerchantFilter("all");
      }
    });
  }, [showMerchantFilter]);

  const { clients, loading, load, total, pages, pageSize } = useClients(token, authLoading, {
    onboardingOnly,
    page,
    pageSize: CLIENTS_PAGE_SIZE,
    search: debouncedSearch,
    merchantFilter: showMerchantFilter ? merchantFilter : activeMerchantId ?? undefined,
    salesRepId: showSalesRepFilter ? salesRepId : null,
    sedeId: isGlobal ? selectedSedeId : null,
    enabled: listEnabled,
  });
  const { bulkDeleteClients } = useClientWorkflow(token);

  const visibleClientIds = useMemo(() => clients.map((client) => client.id), [clients]);

  const toggleSelect = useCallback((clientId: number) => {
    setSelectedIds((current) =>
      current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId],
    );
  }, []);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds((current) => {
      const allSelected = visibleClientIds.every((id) => current.includes(id));
      if (allSelected) {
        return current.filter((id) => !visibleClientIds.includes(id));
      }
      return Array.from(new Set([...current, ...visibleClientIds]));
    });
  }, [visibleClientIds]);

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const ok = await bulkDeleteClients(selectedIds);
    if (ok) {
      setSelectedIds([]);
      await load({ bustCache: true });
    }
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSelectSede(id: number) {
    setSelectedSedeId(id);
    router.replace(clientsListPath(id));
  }

  function handleBackToSedes() {
    setSelectedSedeId(null);
    setSalesRepId(null);
    setSearchInput("");
    setMerchantFilter("all");
    router.replace(clientsListPath(null));
  }

  const canRunReminders = canRunOnboardingReminders(user);

  const headerTitle = isGlobal ? t("clients.adminHeaderContext") : t("clients.headerContext");
  const headerSubtitle = isGlobal ? t("clients.adminPageSubtitleSedes") : clientsSubtitle;
  const adminLoading = isGlobal && (loadingReps || loadingSedes);

  return (
    <>
      <Header title={headerTitle} subtitle={headerSubtitle} />
      <PageContent>
        {adminLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label={t("clients.loading")} />
          </div>
        ) : showSedePicker ? (
          <SedeBranchList
            branches={branches}
            onSelect={handleSelectSede}
            titleKey="clients.adminSedesTitle"
            hintKey="clients.adminSedesSubtitle"
            emptyKey="clients.adminSedesEmpty"
            countLabelKey="clients.adminSedeRepCount"
          />
        ) : (
          <>
            {isGlobal ? (
              <button
                type="button"
                onClick={handleBackToSedes}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <VscArrowLeft className="h-4 w-4" aria-hidden />
                {t("clients.backToSedes")}
              </button>
            ) : null}

            {selectedSede ? (
              <div className="card-flat mb-4 p-5">
                <h2 className="text-lg font-semibold text-slate-900">{selectedSede.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{clientsSubtitle}</p>
              </div>
            ) : null}

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <ClientListFilters
                search={searchInput}
                merchantFilter={merchantFilter}
                merchants={workspaceMerchants}
                showMerchantFilter={showMerchantFilter}
                salesRepId={salesRepId}
                salesReps={repsForSede}
                showSalesRepFilter={showSalesRepFilter}
                onSearchChange={setSearchInput}
                onMerchantFilterChange={setMerchantFilter}
                onSalesRepFilterChange={setSalesRepId}
              />

              {canRunReminders ? (
                <div className="flex shrink-0 items-center gap-1.5 self-end">
                  <OnboardingRemindersButton token={token} />
                </div>
              ) : null}
            </div>

            {canBulkDelete && selectedIds.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3">
                <p className="text-sm font-medium text-slate-700">
                  {t("clients.selectedCount", { count: selectedIds.length })}
                </p>
                <Button variant="danger" size="sm" onClick={() => void handleBulkDelete()}>
                  <HiOutlineTrash className="mr-1.5 inline h-4 w-4" />
                  {t("clients.bulkDelete")}
                </Button>
              </div>
            ) : null}

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner label={t("clients.loading")} />
              </div>
            ) : (
              <ClientList
                clients={clients}
                canBulkDelete={canBulkDelete}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAllOnPage}
                showMerchantColumn={merchantFilter === "all"}
                showSalesRepColumn={showSalesRepFilter}
                showAdvisorColumn={showAdvisorColumn}
                sedeId={selectedSedeId}
                page={page}
                pages={pages}
                total={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </PageContent>
    </>
  );
}
