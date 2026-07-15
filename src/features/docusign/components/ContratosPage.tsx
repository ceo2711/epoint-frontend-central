"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { fetchCalendlySalesReps } from "@/lib/queryFetchers";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { EnvelopeList } from "@/features/docusign/components/EnvelopeList";
import { RegisterClientFromContractModal } from "@/features/docusign/components/RegisterClientFromContractModal";
import { SendContractForm } from "@/features/docusign/components/SendContractForm";
import { useDocusign } from "@/features/docusign/hooks/useDocusign";
import { ProspectLinkPickerModal } from "@/features/prospects/components/ProspectLinkPickerModal";
import type { DocusignEnvelope, DocusignRegisterClientPayload } from "@/features/docusign/types";
import type { Prospect } from "@/features/prospects/types";
import type { Paginated } from "@/types/api";
import { ApiError, api } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT } from "@/lib/clientEvents";

const CONTRACT_ROLES = new Set(["ADMIN", "SALES_REP"]);

export function ContratosPage() {
  const router = useRouter();
  const modal = useModal();
  const { user, token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [registerEnvelope, setRegisterEnvelope] = useState<DocusignEnvelope | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [linkEnvelope, setLinkEnvelope] = useState<DocusignEnvelope | null>(null);
  const [salesReps, setSalesReps] = useState<CalendlySalesRep[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);

  const isAdmin = user?.role.code === "ADMIN";
  const isSalesRep = user?.role.code === "SALES_REP";
  const canLinkProspect = hasPermission("prospects:update");

  const {
    connection,
    templates,
    envelopes,
    loading,
    loadingEnvelopes,
    error,
    sendEnvelope,
    syncEnvelope,
    downloadSignedDocument,
    downloadSentDocument,
    registerClientFromEnvelope,
    searchClients,
    loadTemplateDetail,
  } = useDocusign(token, {
    adminView: isAdmin,
    salesRepId: isAdmin ? selectedRepId : undefined,
  });

  useEffect(() => {
    if (user && !CONTRACT_ROLES.has(user.role.code)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    setLoadingReps(true);
    fetchCalendlySalesReps(token)
      .then(setSalesReps)
      .catch(() => setSalesReps([]))
      .finally(() => setLoadingReps(false));
  }, [token, isAdmin]);

  if (!user || !CONTRACT_ROLES.has(user.role.code)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedRep = salesReps.find((rep) => rep.id === selectedRepId);

  async function searchProspects(query: string): Promise<Prospect[]> {
    if (!token || !canLinkProspect) return [];
    const params = new URLSearchParams({ search: query, page: "1", page_size: "10" });
    const data = await api.get<Paginated<Prospect>>(`/prospects?${params.toString()}`, token);
    return data.items;
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
        message: getUserFacingErrorMessage(err, t("docusign.sendError")),
        variant: "error",
      });
    }
  }

  async function handleDownloadSigned(envelopeId: number) {
    try {
      const blob = await downloadSignedDocument(envelopeId);
      if (!blob) return;
      const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("docusign.downloadError")),
        variant: "error",
      });
    }
  }

  async function handleDownloadSent(envelopeId: number) {
    try {
      const blob = await downloadSentDocument(envelopeId);
      if (!blob) return;
      const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("docusign.downloadSentError")),
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
        message: getUserFacingErrorMessage(err, t("docusign.syncError")),
        variant: "error",
      });
    } finally {
      setSyncingId(null);
    }
  }

  async function handleRegisterClient(envelopeId: number, payload: DocusignRegisterClientPayload) {
    try {
      const result = await registerClientFromEnvelope(envelopeId, payload);
      setRegisterEnvelope(null);
      window.dispatchEvent(new CustomEvent(CLIENTS_REFRESH_EVENT));
      await modal.alert({
        title: t("docusign.registerClientSuccessTitle"),
        message: t("docusign.registerClientSuccessMessage", { clientId: result?.client_id ?? "" }),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("docusign.registerClientError")),
        variant: "error",
      });
      throw err;
    }
  }

  async function handleLinkEnvelopeToProspect(prospectId: number) {
    if (!token || !linkEnvelope) return;
    try {
      await api.post(
        `/prospects/${prospectId}/link-envelope`,
        { envelope_id: linkEnvelope.id },
        token,
      );
      setLinkEnvelope(null);
      await modal.alert({
        title: t("prospects.linkContractSuccessTitle"),
        message: t("prospects.linkContractSuccessMessage"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  const pageSubtitle = isAdmin ? t("docusign.adminPageSubtitle") : t("docusign.pageSubtitle");

  return (
    <>
      <Header title={t("docusign.pageTitle")} subtitle={pageSubtitle} />
      <PageContent className="space-y-6">
        {loading && !isAdmin ? (
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
            ) : isAdmin ? (
              selectedRepId === null ? (
                loadingReps ? (
                  <div className="flex justify-center py-16">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <SalesRepList
                    reps={salesReps}
                    onSelect={setSelectedRepId}
                    hintKey="calendly.contractsSalesRepsHint"
                    showConnectionStatus={false}
                  />
                )
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedRepId(null)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    <VscArrowLeft className="h-4 w-4" aria-hidden />
                    {t("docusign.backToSalesReps")}
                  </button>

                  <div className="card-flat p-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedRep
                        ? `${selectedRep.first_name} ${selectedRep.last_name}`
                        : t("common.dash")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{t("docusign.adminRepContractsHint")}</p>
                  </div>

                  {loadingEnvelopes ? (
                    <div className="flex justify-center py-16">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <EnvelopeList
                      envelopes={envelopes}
                      onSync={handleSync}
                      onDownloadSigned={handleDownloadSigned}
                      onDownloadSent={handleDownloadSent}
                      onLinkProspect={canLinkProspect ? setLinkEnvelope : undefined}
                      syncingId={syncingId}
                      showClientColumn={false}
                    />
                  )}
                </>
              )
            ) : (
              <>
                <SendContractForm
                  templates={templates}
                  defaultTemplateId={connection.default_template_id}
                  defaultRoleName={connection.default_template_role_name}
                  onSearchClients={searchClients}
                  onSearchProspects={canLinkProspect ? searchProspects : undefined}
                  onLoadTemplateDetail={loadTemplateDetail}
                  onSubmit={handleSend}
                />

                <EnvelopeList
                  envelopes={envelopes}
                  onSync={handleSync}
                  onDownloadSigned={handleDownloadSigned}
                  onDownloadSent={handleDownloadSent}
                  onRegisterClient={setRegisterEnvelope}
                  onLinkProspect={canLinkProspect ? setLinkEnvelope : undefined}
                  syncingId={syncingId}
                  showClientColumn={false}
                />
              </>
            )}
          </>
        )}
      </PageContent>

      {registerEnvelope && isSalesRep ? (
        <RegisterClientFromContractModal
          envelope={registerEnvelope}
          token={token}
          onSubmit={handleRegisterClient}
          onClose={() => setRegisterEnvelope(null)}
        />
      ) : null}

      {linkEnvelope && canLinkProspect ? (
        <ProspectLinkPickerModal
          token={token}
          title={t("prospects.linkToProspect")}
          emailHint={linkEnvelope.signer_email}
          onClose={() => setLinkEnvelope(null)}
          onSelect={handleLinkEnvelopeToProspect}
        />
      ) : null}
    </>
  );
}
