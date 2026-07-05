"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientCreateModal } from "@/features/clients/components/ClientCreateModal";
import { ClientList } from "@/features/clients/components/ClientList";
import { OnboardingRemindersButton } from "@/features/clients/components/OnboardingRemindersButton";
import { useClientWorkflow } from "@/features/clients/hooks/useClientWorkflow";
import { CLIENTS_PAGE_SIZE, useClients } from "@/features/clients/hooks/useClients";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";

export default function ClientesPage() {
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
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
  const { clients, loading, load, total, pages, pageSize } = useClients(token, authLoading, {
    onboardingOnly: roleCode === "ONBOARDING_MANAGER",
    page,
    pageSize: CLIENTS_PAGE_SIZE,
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
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          {canRunReminders && <OnboardingRemindersButton token={token} />}
          {hasPermission("clients:create") ? (
            <Button size="sm" onClick={() => setCreateModalOpen(true)}>
              {t("clients.register")}
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner label={t("clients.loading")} />
          </div>
        ) : (
          <ClientList
            clients={clients}
            canApprove={hasPermission("clients:approve")}
            canUpdate={hasPermission("clients:update")}
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
