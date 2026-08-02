"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner, PageLoader } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import { EnvelopeList } from "@/features/docusign/components/EnvelopeList";
import { RegisterClientFromContractModal } from "@/features/docusign/components/RegisterClientFromContractModal";
import { SendContractForm } from "@/features/docusign/components/SendContractForm";
import { useDocusign } from "@/features/docusign/hooks/useDocusign";
import { ProspectLinkPickerModal } from "@/features/prospects/components/ProspectLinkPickerModal";
import { SedeBranchList } from "@/features/sedes/components/SedeBranchList";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import {
  buildSedeBranchesFromReps,
  filterRepsBySede,
} from "@/features/sedes/utils/sedeBranches";
import type { DocusignEnvelope, DocusignRegisterClientPayload } from "@/features/docusign/types";
import { PROSPECT_SEARCH_LIMIT } from "@/features/prospects/components/ProspectSearchSelect";
import type { Prospect } from "@/features/prospects/types";
import type { Paginated } from "@/types/api";
import { api } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT } from "@/lib/clientEvents";
import { canSuperviseSalesReps, isGlobalAdmin, isSalesAreaLeader } from "@/lib/roles";

const CONTRACT_ROLES = new Set(["ADMIN", "BRANCH_MANAGER", "SALES_REP", "SUB_SELLER", "AREA_LEADER"]);

export function ContratosPage() {
  const router = useRouter();
  const modal = useModal();
  const { user, token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [registerEnvelope, setRegisterEnvelope] = useState<DocusignEnvelope | null>(null);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [linkEnvelope, setLinkEnvelope] = useState<DocusignEnvelope | null>(null);

  const canSupervise = canSuperviseSalesReps(user);
  const isGlobal = isGlobalAdmin(user?.role.code);
  const isSalesRep = user?.role.code === "SALES_REP" || user?.role.code === "SUB_SELLER";
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
    adminView: canSupervise,
    salesRepId: canSupervise ? selectedRepId : undefined,
    listenRefresh: true,
  });

  const { sedes, loading: loadingSedes } = useSedes(
    token,
    isGlobal && hasPermission("sedes:read"),
    t("sedes.loadError"),
    "",
    false,
  );

  const { salesReps, loading: loadingReps } = useSalesReps(token, canSupervise);

  const branches = useMemo(
    () =>
      buildSedeBranchesFromReps(salesReps, sedes, {
        includeAllSedes: isGlobal,
        fallbackName: t("users.sede"),
      }),
    [salesReps, sedes, isGlobal, t],
  );

  const repsForSelectedSede = useMemo(
    () =>
      filterRepsBySede(salesReps, selectedSedeId, {
        filterBySede: isGlobal,
      }),
    [salesReps, selectedSedeId, isGlobal],
  );

  const selectedSede = branches.find((branch) => branch.id === selectedSedeId) ?? null;

  useEffect(() => {
    if (!user) return;
    const allowed =
      CONTRACT_ROLES.has(user.role.code) &&
      (user.role.code !== "AREA_LEADER" || isSalesAreaLeader(user));
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (
    !user ||
    !CONTRACT_ROLES.has(user.role.code) ||
    (user.role.code === "AREA_LEADER" && !isSalesAreaLeader(user))
  ) {
    return <PageLoader />;
  }

  const selectedRep = salesReps.find((rep) => rep.id === selectedRepId);
  const adminLoading = loadingReps || (isGlobal && loadingSedes);
  // No incluir loading de envelopes: eso es carga parcial al elegir vendedor
  const pageLoading = canSupervise
    ? adminLoading || (loading && !loadingEnvelopes)
    : loading;

  function handleSelectSede(id: number) {
    setSelectedSedeId(id);
    setSelectedRepId(null);
  }

  function handleBackFromReps() {
    setSelectedRepId(null);
    if (isGlobal) setSelectedSedeId(null);
  }

  async function searchProspects(query: string) {
    if (!token || !canLinkProspect) return { items: [], total: 0 };
    const params = new URLSearchParams({
      search: query,
      page: "1",
      page_size: String(PROSPECT_SEARCH_LIMIT),
    });
    const data = await api.get<Paginated<Prospect>>(`/prospects?${params.toString()}`, token);
    return { items: data.items, total: data.total };
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

  const pageSubtitle = canSupervise
    ? isGlobal
      ? t("docusign.adminPageSubtitleSedes")
      : t("docusign.adminPageSubtitle")
    : t("docusign.pageSubtitle");

  function renderAdminContent() {
    if (!connection?.connected) {
      return <div className="card-flat p-6 text-sm text-slate-600">{t("docusign.notConfigured")}</div>;
    }

    if (isGlobal && selectedSedeId === null) {
      return (
        <SedeBranchList
          branches={branches}
          onSelect={handleSelectSede}
          titleKey="docusign.adminSedesTitle"
          hintKey="docusign.adminSedesSubtitle"
          emptyKey="docusign.adminSedesEmpty"
          countLabelKey="docusign.adminSedeRepCount"
        />
      );
    }

    if (selectedRepId === null) {
      return (
        <>
          {isGlobal ? (
            <button
              type="button"
              onClick={handleBackFromReps}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <VscArrowLeft className="h-4 w-4" aria-hidden />
              {t("docusign.backToSedes")}
            </button>
          ) : null}
          {selectedSede ? (
            <div className="card-flat mb-4 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{selectedSede.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("calendly.contractsSalesRepsHint")}</p>
            </div>
          ) : null}
          <SalesRepList
            reps={repsForSelectedSede}
            onSelect={setSelectedRepId}
            hintKey="calendly.contractsSalesRepsHint"
            showConnectionStatus={false}
          />
        </>
      );
    }

    return (
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
          <div className="flex justify-center py-20">
            <LoadingSpinner label={t("common.loading")} />
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
    );
  }

  return (
    <>
      <Header title={t(canSupervise ? "docusign.adminHeaderContext" : "docusign.headerContext")} subtitle={pageSubtitle} />
      {pageLoading ? (
        <PageLoader label={t("common.loading")} />
      ) : (
        <PageContent className="space-y-6">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {canSupervise ? (
            renderAdminContent()
          ) : !connection?.connected ? (
            <div className="card-flat p-6 text-sm text-slate-600">{t("docusign.notConfigured")}</div>
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
        </PageContent>
      )}

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
          salesRepId={canSupervise ? selectedRepId : null}
          onClose={() => setLinkEnvelope(null)}
          onSelect={handleLinkEnvelopeToProspect}
        />
      ) : null}
    </>
  );
}
