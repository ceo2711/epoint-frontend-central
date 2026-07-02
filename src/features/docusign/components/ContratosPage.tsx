"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
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
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const {
    connection,
    templates,
    envelopes,
    loading,
    error,
    sendEnvelope,
    syncEnvelope,
    downloadSignedDocument,
    searchClients,
    loadTemplateDetail,
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

  async function handleDownload(envelopeId: number) {
    try {
      const blob = await downloadSignedDocument(envelopeId);
      if (!blob) return;
      const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("docusign.downloadError"),
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

            {!connection?.connected ? (
              <div className="card-flat p-6 text-sm text-slate-600">{t("docusign.notConfigured")}</div>
            ) : (
              <>
                <SendContractForm
                  templates={templates}
                  defaultTemplateId={connection.default_template_id}
                  defaultRoleName={connection.default_template_role_name}
                  onSearchClients={searchClients}
                  onLoadTemplateDetail={loadTemplateDetail}
                  onSubmit={handleSend}
                />

                <EnvelopeList
                  envelopes={envelopes}
                  onSync={handleSync}
                  onDownload={handleDownload}
                  syncingId={syncingId}
                />
              </>
            )}
          </>
        )}
      </PageContent>
    </>
  );
}
