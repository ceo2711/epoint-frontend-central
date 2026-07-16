"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useMerchant } from "@/contexts/MerchantContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlySalesRep } from "@/features/calendly/types";
import {
  ClientListFilters,
  type ClientMerchantFilter,
} from "@/features/clients/components/ClientListFilters";
import { ClientList } from "@/features/clients/components/ClientList";
import { OnboardingRemindersButton } from "@/features/clients/components/OnboardingRemindersButton";
import { useClientWorkflow } from "@/features/clients/hooks/useClientWorkflow";
import { CLIENTS_PAGE_SIZE, useClients } from "@/features/clients/hooks/useClients";
import { onClientsRefresh } from "@/lib/clientEvents";
import { fetchCalendlySalesReps } from "@/lib/queryFetchers";

export function ClientesPage() {
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
  const { merchants: workspaceMerchants, activeMerchantId } = useMerchant();
  const { t } = useTranslation();
  const roleCode = user?.role.code;
  const clientsSubtitle =
    roleCode === "ADVISOR"
      ? t("clients.subtitleAdvisor")
      : roleCode === "ONBOARDING_MANAGER"
        ? t("clients.subtitleOnboarding")
        : t("clients.subtitle");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState<ClientMerchantFilter>("all");
  const [salesRepId, setSalesRepId] = useState<number | null>(null);
  const [salesReps, setSalesReps] = useState<CalendlySalesRep[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const showMerchantFilter = workspaceMerchants.length > 1;
  const showSalesRepFilter = roleCode === "ADMIN";
  const canBulkDelete = roleCode === "ADMIN" && hasPermission("clients:delete");

  useEffect(() => {
    if (!token || !showSalesRepFilter) {
      setSalesReps([]);
      return;
    }
    void fetchCalendlySalesReps(token)
      .then(setSalesReps)
      .catch(() => setSalesReps([]));
  }, [token, showSalesRepFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, merchantFilter, salesRepId]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedSearch, merchantFilter, salesRepId]);

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
    onboardingOnly: roleCode === "ONBOARDING_MANAGER",
    page,
    pageSize: CLIENTS_PAGE_SIZE,
    search: debouncedSearch,
    merchantFilter: showMerchantFilter ? merchantFilter : activeMerchantId ?? undefined,
    salesRepId: showSalesRepFilter ? salesRepId : null,
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

  const canRunReminders =
    roleCode === "ADMIN" || roleCode === "ONBOARDING_MANAGER";

  return (
    <>
      <Header title={t("clients.headerContext")} subtitle={clientsSubtitle} />
      <PageContent>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <ClientListFilters
            search={searchInput}
            merchantFilter={merchantFilter}
            merchants={workspaceMerchants}
            showMerchantFilter={showMerchantFilter}
            salesRepId={salesRepId}
            salesReps={salesReps}
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
            page={page}
            pages={pages}
            total={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
      </PageContent>
    </>
  );
}
