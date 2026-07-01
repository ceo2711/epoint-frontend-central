"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { DocusignConnectForm } from "@/features/docusign/components/DocusignConnectForm";
import { EnvelopeList } from "@/features/docusign/components/EnvelopeList";
import { SendContractForm } from "@/features/docusign/components/SendContractForm";
import { useDocusign } from "@/features/docusign/hooks/useDocusign";
import { ApiError } from "@/lib/api";

const CONTRACT_ROLES = new Set(["ADMIN", "SALES_REP"]);

export function ContratosPage() {
  const router = useRouter();
  const modal = useModal();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role.code === "ADMIN";
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const {
    connection,
    templates,
    envelopes,
    loading,
    error,
    connect,
    disconnect,
    getConsentUrl,
    sendEnvelope,
    syncEnvelope,
    searchClients,
    refresh,
  } = useDocusign(token);

  useEffect(() => {
    if (user && !CONTRACT_ROLES.has(user.role.code)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || !CONTRACT_ROLES.has(user.role.code)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  async function handleConnect(payload: Parameters<typeof connect>[0]) {
    try {
      await connect(payload);
      await modal.alert({
        title: t("docusign.connectSuccessTitle"),
        message: t("docusign.connectSuccessMessage"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("docusign.connectError"),
        variant: "error",
      });
    }
  }

  async function handleConsent() {
    try {
      const result = await getConsentUrl();
      if (result?.consent_url) {
        window.open(result.consent_url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("docusign.consentError"),
        variant: "error",
      });
    }
  }

  async function handleDisconnect() {
    const confirmed = await modal.confirm({
      title: t("docusign.disconnectTitle"),
      message: t("docusign.disconnectConfirm"),
      confirmLabel: t("docusign.disconnectAction"),
      cancelLabel: t("common.cancel"),
    });
    if (!confirmed) return;
    try {
      await disconnect();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("docusign.disconnectError"),
        variant: "error",
      });
    }
  }

  async function handleSend(payload: Parameters<typeof sendEnvelope>[0]) {
    try {
      const result = await sendEnvelope(payload);
      await modal.alert({
        title: t("docusign.sendSuccessTitle"),
        message: result?.message ?? t("docusign.sendSuccessMessage"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("docusign.sendError"),
        variant: "error",
      });
    }
  }

  async function handleSync(envelopeId: number) {
    setSyncingId(envelopeId);
    try {
      await syncEnvelope(envelopeId);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("docusign.syncError"),
        variant: "error",
      });
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <>
      <Header title={t("docusign.pageTitle")} subtitle={t("docusign.pageSubtitle")} />
      <PageContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {isAdmin && !connection?.connected ? (
              <div className="card-flat space-y-4 p-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{t("docusign.connectTitle")}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t("docusign.connectSubtitle")}</p>
                </div>
                <DocusignConnectForm onSubmit={handleConnect} onConsent={handleConsent} />
              </div>
            ) : null}

            {connection?.connected ? (
              <>
                <div className="card-flat flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {t("docusign.connectedAs", {
                        account: connection.account_name ?? connection.account_id ?? "",
                      })}
                    </p>
                    {connection.impersonated_user_email ? (
                      <p className="text-sm text-slate-500">{connection.impersonated_user_email}</p>
                    ) : null}
                  </div>
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => void handleConsent()}
                      >
                        {t("docusign.consentAction")}
                      </button>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => void handleDisconnect()}
                      >
                        {t("docusign.disconnectAction")}
                      </button>
                      <button
                        type="button"
                        className="text-sm text-slate-600 hover:underline"
                        onClick={() => void refresh()}
                      >
                        {t("docusign.refreshAction")}
                      </button>
                    </div>
                  ) : null}
                </div>

                <SendContractForm
                  templates={templates}
                  defaultTemplateId={connection.default_template_id}
                  defaultRoleName={connection.default_template_role_name}
                  onSearchClients={searchClients}
                  onSubmit={handleSend}
                />

                <EnvelopeList envelopes={envelopes} onSync={handleSync} syncingId={syncingId} />
              </>
            ) : !isAdmin ? (
              <div className="card-flat p-6 text-sm text-slate-600">{t("docusign.notConnectedStaff")}</div>
            ) : null}
          </>
        )}
      </PageContent>
    </>
  );
}
