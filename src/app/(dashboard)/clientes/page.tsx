"use client";

import { FormEvent, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientCreateForm } from "@/features/clients/components/ClientCreateForm";
import { ClientList } from "@/features/clients/components/ClientList";
import { OnboardingRemindersButton } from "@/features/clients/components/OnboardingRemindersButton";
import { useClientAvailabilityCheck } from "@/features/clients/hooks/useClientAvailabilityCheck";
import { useClientWorkflow } from "@/features/clients/hooks/useClientWorkflow";
import { useClients } from "@/features/clients/hooks/useClients";
import { EMPTY_CLIENT_FORM } from "@/features/clients/types";
import type { ClientFormData } from "@/features/clients/types";
import { formatClientConflict } from "@/features/clients/utils";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import { ApiError, api } from "@/lib/api";
import { emitClientsRefresh } from "@/lib/clientEvents";

export default function ClientesPage() {
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const roleCode = user?.role.code;
  const clientsSubtitle =
    roleCode === "ADVISOR"
      ? t("clients.subtitleAdvisor")
      : roleCode === "ONBOARDING_MANAGER"
        ? t("clients.subtitleOnboarding")
        : t("clients.subtitle");
  const { clients, loading, load } = useClients(token, authLoading, {
    onboardingOnly: roleCode === "ONBOARDING_MANAGER",
  });
  const { merchants, loading: merchantsLoading } = useMerchantOptions(
    token,
    hasPermission("clients:create") || hasPermission("clients:update"),
  );
  const { approveClient, rejectClient, resubmitClient } = useClientWorkflow(token);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClientFormData>(EMPTY_CLIENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { availability, checking, hasConflict } = useClientAvailabilityCheck(
    token,
    form.email,
    form.phone,
    { enabled: showForm },
  );

  const emailError = availability?.email
    ? formatClientConflict(t, "email", availability.email)
    : undefined;
  const phoneError = availability?.phone
    ? formatClientConflict(t, "phone", availability.phone)
    : undefined;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || hasConflict) return;
    setSubmitting(true);
    try {
      await api.post(
        "/clients",
        {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          source: form.source,
          merchant_id: Number(form.merchant_id),
        },
        token,
      );
      setShowForm(false);
      setForm(EMPTY_CLIENT_FORM);
      emitClientsRefresh();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("common.error"),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: number, name: string) {
    if (await approveClient(id, name)) await load();
  }

  async function handleReject(id: number, name: string) {
    if (await rejectClient(id, name)) await load();
  }

  async function handleResubmit(id: number, name: string) {
    if (await resubmitClient(id, name)) await load();
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
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? t("common.cancel") : t("clients.register")}
            </Button>
          ) : null}
        </div>

        {showForm && (
          <ClientCreateForm
            form={form}
            merchants={merchants}
            merchantsLoading={merchantsLoading}
            onChange={setForm}
            onSubmit={handleCreate}
            submitting={submitting}
            checking={checking}
            hasConflict={hasConflict}
            emailError={emailError}
            phoneError={phoneError}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner label={t("clients.loading")} />
          </div>
        ) : (
          <ClientList
            clients={clients}
            canApprove={hasPermission("clients:approve")}
            canUpdate={hasPermission("clients:update")}
            onApprove={handleApprove}
            onReject={handleReject}
            onResubmit={handleResubmit}
          />
        )}
      </PageContent>
    </>
  );
}
