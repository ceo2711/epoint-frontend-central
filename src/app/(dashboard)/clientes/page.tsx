"use client";

import { useEffect, useState } from "react";
import { HiOutlineUserPlus } from "react-icons/hi2";

import { Header } from "@/components/layout/Header";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useMerchant } from "@/contexts/MerchantContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientCreateModal } from "@/features/clients/components/ClientCreateModal";
import {
  ClientListFilters,
  type ClientMerchantFilter,
} from "@/features/clients/components/ClientListFilters";
import { ClientList } from "@/features/clients/components/ClientList";
import { OnboardingRemindersButton } from "@/features/clients/components/OnboardingRemindersButton";
import { useClientWorkflow } from "@/features/clients/hooks/useClientWorkflow";
import { CLIENTS_PAGE_SIZE, useClients } from "@/features/clients/hooks/useClients";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";

export default function ClientesPage() {
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState<ClientMerchantFilter>(
    activeMerchantId ?? "all",
  );

  const showMerchantFilter = workspaceMerchants.length > 1;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, merchantFilter]);

  useEffect(() => {
    if (activeMerchantId != null) {
      setMerchantFilter(activeMerchantId);
    }
  }, [activeMerchantId]);

  const { clients, loading, load, total, pages, pageSize } = useClients(token, authLoading, {
    onboardingOnly: roleCode === "ONBOARDING_MANAGER",
    page,
    pageSize: CLIENTS_PAGE_SIZE,
    search: debouncedSearch,
    merchantFilter: showMerchantFilter ? merchantFilter : activeMerchantId ?? undefined,
  });
  const { merchants, loading: merchantsLoading } = useMerchantOptions(
    token,
    hasPermission("clients:create") || hasPermission("clients:update"),
  );
  const { approveClient, rejectClient, resubmitClient } = useClientWorkflow(token);

  async function handleApprove(id: number, name: string) {
    if (await approveClient(id, name)) await load();
  }

  async function handleReject(id: number, name: string) {
    if (await rejectClient(id, name)) await load();
  }

  async function handleResubmit(id: number, name: string) {
    if (await resubmitClient(id, name)) await load();
  }

  function handleCreateSuccess() {
    setPage(1);
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
            onSearchChange={setSearchInput}
            onMerchantFilterChange={setMerchantFilter}
          />

          <div className="flex shrink-0 items-center gap-1.5 self-end">
            {canRunReminders ? <OnboardingRemindersButton token={token} /> : null}
            {hasPermission("clients:create") ? (
              <IconActionButton
                label={t("clients.register")}
                icon={<HiOutlineUserPlus />}
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
              />
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label={t("clients.loading")} />
          </div>
        ) : (
          <ClientList
            clients={clients}
            canApprove={hasPermission("clients:approve")}
            canUpdate={hasPermission("clients:update")}
            showMerchantColumn={merchantFilter === "all"}
            page={page}
            pages={pages}
            total={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onApprove={handleApprove}
            onReject={handleReject}
            onResubmit={handleResubmit}
          />
        )}
      </PageContent>

      {createModalOpen ? (
        <ClientCreateModal
          token={token}
          merchants={merchants}
          merchantsLoading={merchantsLoading}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      ) : null}
    </>
  );
}
