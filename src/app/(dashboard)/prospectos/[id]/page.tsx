"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { copyToClipboard } from "@/lib/clipboard";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientSourceSelect } from "@/features/clients/components/ClientSourceSelect";
import { CLIENT_SOURCE_LABEL_KEYS, type ClientSourceValue } from "@/features/clients/constants";
import { SendContractModal } from "@/features/docusign/components/SendContractModal";
import { DOCUSIGN_REFRESH_EVENT } from "@/features/docusign/docusign-events";
import { useDocusign } from "@/features/docusign/hooks/useDocusign";
import { PaymentLinkForm } from "@/features/payments/components/PaymentLinkForm";
import type { PaymentLink } from "@/features/payments/types";
import { PAYMENT_COMPLETED_EVENT, type PaymentCompletedDetail } from "@/features/payments/payment-events";
import { usePayments, fetchLinkablePaymentLinks } from "@/features/payments/hooks/usePayments";
import { ProspectCalendlyLinkModal } from "@/features/prospects/components/ProspectCalendlyLinkModal";
import { ProspectContractsModal } from "@/features/prospects/components/ProspectContractsModal";
import { ProspectExistingPaymentModal } from "@/features/prospects/components/ProspectExistingResourceModals";
import { ProspectHistoryTimeline } from "@/features/prospects/components/ProspectHistoryTimeline";
import { ProspectLinkedResources } from "@/features/prospects/components/ProspectLinkedResources";
import { ProspectPaymentsModal } from "@/features/prospects/components/ProspectPaymentsModal";
import { ProspectStatusBadge, ProspectQualificationBadge } from "@/features/prospects/components/ProspectStatusBadge";
import { useProspectDetail } from "@/features/prospects/hooks/useProspects";
import { getAllowedNextStatuses } from "@/features/prospects/utils/transitions";
import { findContactHistory, isReadyForClientConversion, sellerMarkedContacted } from "@/features/prospects/utils/pipeline";
import type { ProspectDetail } from "@/features/prospects/types";
import { api } from "@/lib/api";

const PENDING_CONTRACT_SYNC_MS = 15_000;
const PIPELINE_POLL_MS = 10_000;

type ProspectEditForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  is_qualified: boolean;
};

function buildProspectForm(prospect: ProspectDetail): ProspectEditForm {
  return {
    first_name: prospect.first_name,
    last_name: prospect.last_name,
    email: prospect.email,
    phone: prospect.phone,
    source: prospect.source ?? "",
    notes: prospect.notes ?? "",
    is_qualified: prospect.is_qualified,
  };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="section-label">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value || "—"}</p>
    </div>
  );
}

export default function ProspectoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const id = typeof rawId === "string" ? Number(rawId) : NaN;
  const idValid = Number.isFinite(id) && id > 0;

  const { token, hasPermission } = useAuth();
  const { t, locale } = useTranslation();
  const modal = useModal();
  const { prospect, loading, reload } = useProspectDetail(token, idValid ? id : 0);
  const pipelineSnapshotRef = useRef<{
    hydrated: boolean;
    ready: boolean;
    convertedId: number | null;
  }>({ hydrated: false, ready: false, convertedId: null });
  const conversionModalKeyRef = useRef<string | null>(null);

  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [calendlyMarkContactedOpen, setCalendlyMarkContactedOpen] = useState(false);
  const [markChoiceOpen, setMarkChoiceOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [contractsListOpen, setContractsListOpen] = useState(false);
  const [paymentsListOpen, setPaymentsListOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentPickerOpen, setPaymentPickerOpen] = useState(false);
  const [linkablePayments, setLinkablePayments] = useState<PaymentLink[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProspectEditForm | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const canUpdate = hasPermission("prospects:update");
  const isConverted = !!prospect?.converted_client_id;
  const canEditBasic = canUpdate && !isConverted;
  const allowedStatuses = prospect ? getAllowedNextStatuses(prospect.status) : [];

  useEffect(() => {
    if (prospect && !editing) {
      setEditForm(buildProspectForm(prospect));
    }
  }, [prospect, editing]);

  const {
    connection,
    templates,
    sendEnvelope,
    searchClients,
    loadTemplateDetail,
    downloadSignedDocument,
    downloadSentDocument,
  } = useDocusign(token, { loadEnvelopes: false, listenRefresh: false });

  const { config, createLink, isCreating } = usePayments(token);

  const hasPendingContracts = useMemo(() => {
    if (!prospect?.docusign_envelopes.length) return false;
    const terminal = new Set(["completed", "declined", "voided"]);
    return prospect.docusign_envelopes.some(
      (envelope) => !terminal.has(envelope.status.toLowerCase()),
    );
  }, [prospect?.docusign_envelopes]);

  const waitingForPayment = useMemo(() => {
    if (!prospect || prospect.converted_client_id) return false;
    const payments = prospect.payment_links?.length
      ? prospect.payment_links
      : prospect.payment_link
        ? [prospect.payment_link]
        : [];
    if (payments.length === 0) return false;
    if (payments.some((item) => item.status.toLowerCase() === "paid")) return false;
    return payments.some((item) => item.status.toLowerCase() === "pending");
  }, [prospect]);

  const pipelineComplete = useMemo(() => {
    if (!prospect) return false;
    return isReadyForClientConversion(
      prospect.calendly_event,
      prospect.status,
      prospect.docusign_envelopes,
      prospect.payment_link,
      prospect.payment_links ?? [],
      prospect.history ?? [],
    );
  }, [prospect]);

  const waitingOnPipeline = Boolean(
    prospect &&
      !prospect.converted_client_id &&
      (hasPendingContracts || waitingForPayment || pipelineComplete),
  );

  useEffect(() => {
    if (!prospect?.id) return;

    const onDocusignUpdate = () => {
      void reload({ silent: true });
    };
    window.addEventListener(DOCUSIGN_REFRESH_EVENT, onDocusignUpdate);
    return () => window.removeEventListener(DOCUSIGN_REFRESH_EVENT, onDocusignUpdate);
  }, [prospect?.id, reload]);

  useEffect(() => {
    if (!token || !prospect?.id || !waitingOnPipeline) return;

    let cancelled = false;

    const syncPipeline = async () => {
      if (hasPendingContracts) {
        try {
          await api.post("/docusign/envelopes/sync-pending", {}, token, { silentHttpErrors: true });
        } catch {
          /* El webhook o el próximo ciclo actualizarán el estado. */
        }
      }
      if (!cancelled) void reload({ silent: true });
    };

    void syncPipeline();
    const intervalMs = hasPendingContracts ? PENDING_CONTRACT_SYNC_MS : PIPELINE_POLL_MS;
    const timer = window.setInterval(() => void syncPipeline(), intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token, prospect?.id, waitingOnPipeline, hasPendingContracts, reload]);

  useEffect(() => {
    if (!prospect?.id || prospect.converted_client_id || !waitingOnPipeline) return;

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        void reload({ silent: true });
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [prospect?.id, prospect?.converted_client_id, waitingOnPipeline, reload]);

  useEffect(() => {
    if (!prospect?.id) return;

    const onPaymentCompleted = (event: Event) => {
      const detail = (event as CustomEvent<PaymentCompletedDetail>).detail;
      const matchesProspect =
        detail?.prospectId == null || detail.prospectId === prospect.id;
      const matchesPaymentLink =
        detail?.paymentLinkId == null ||
        prospect.payment_link_id == null ||
        detail.paymentLinkId === prospect.payment_link_id;
      if (!matchesProspect || !matchesPaymentLink) return;
      void reload({ silent: true });
    };

    window.addEventListener(PAYMENT_COMPLETED_EVENT, onPaymentCompleted);
    return () => window.removeEventListener(PAYMENT_COMPLETED_EVENT, onPaymentCompleted);
  }, [prospect?.id, prospect?.payment_link_id, reload]);

  useEffect(() => {
    if (!prospect) return;

    const name = prospect.full_name;
    const convertedId = prospect.converted_client_id;
    const snapshot = pipelineSnapshotRef.current;

    if (!snapshot.hydrated) {
      pipelineSnapshotRef.current = {
        hydrated: true,
        ready: pipelineComplete,
        convertedId,
      };
      return;
    }

    const justConverted = snapshot.convertedId == null && convertedId != null;
    const justBecameReady = !snapshot.ready && pipelineComplete && convertedId == null;

    pipelineSnapshotRef.current = {
      hydrated: true,
      ready: pipelineComplete || convertedId != null,
      convertedId,
    };

    if (justConverted) {
      const modalKey = `converted:${convertedId}`;
      if (conversionModalKeyRef.current === modalKey) return;
      conversionModalKeyRef.current = modalKey;
      void (async () => {
        const goToClient = await modal.confirm({
          title: t("prospects.conversionDoneTitle"),
          message: t("prospects.conversionDoneMessage", { name }),
          confirmLabel: t("prospects.conversionDoneAction"),
          cancelLabel: t("common.close"),
          variant: "primary",
        });
        if (goToClient) {
          router.push(`/clientes/${convertedId}`);
        }
      })();
      return;
    }

    if (justBecameReady) {
      const modalKey = `ready:${prospect.id}`;
      if (conversionModalKeyRef.current === modalKey) return;
      conversionModalKeyRef.current = modalKey;
      void modal.alert({
        title: t("prospects.conversionReadyTitle"),
        message: t("prospects.conversionReadyMessage", { name }),
        variant: "success",
      });
    }
  }, [prospect, pipelineComplete, modal, t, router]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!token || !prospect || !noteText.trim() || !canUpdate) return;
    setNoteSubmitting(true);
    try {
      await api.post(`/prospects/${prospect.id}/notes`, { note: noteText.trim() }, token);
      setNoteText("");
      await reload({ silent: true });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("prospects.noteError")),
        variant: "error",
      });
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function handleMarkContacted() {
    if (!token || !prospect || !canUpdate) return;

    // Ya tiene reunión vinculada: confirmar y marcar sin comentario.
    if (prospect.calendly_event) {
      const confirmed = await modal.confirm({
        title: t("prospects.markContactedTitle"),
        message: t("prospects.markContactedConfirmWithMeeting", { name: prospect.full_name }),
        confirmLabel: t("prospects.markContacted"),
        cancelLabel: t("common.cancel"),
      });
      if (!confirmed) return;
      try {
        await api.post(`/prospects/${prospect.id}/mark-contacted`, {}, token);
        await reload({ silent: true });
        await modal.alert({
          title: t("prospects.markContactedTitle"),
          message: t("prospects.markContactedSuccess"),
          variant: "success",
        });
      } catch (err) {
        await modal.alert({
          title: t("common.error"),
          message: getUserFacingErrorMessage(err, t("prospects.statusUpdateError")),
          variant: "error",
        });
      }
      return;
    }

    // Sin reunión: elegir vincular una del calendario o marcar con comentario.
    if (prospect.assigned_to_user_id) {
      setMarkChoiceOpen(true);
      return;
    }
    await startManualContactNote();
  }

  async function startManualContactNote() {
    if (!token || !prospect || !canUpdate) return;
    setMarkChoiceOpen(false);
    setCalendlyMarkContactedOpen(false);
    const note = await modal.prompt({
      title: t("prospects.markContactedTitle"),
      label: t("prospects.markContactedConfirm", { name: prospect.full_name }),
      placeholder: t("prospects.markContactedChannelPlaceholder"),
      confirmLabel: t("prospects.markContacted"),
      cancelLabel: t("common.cancel"),
      minLength: 5,
      multiline: true,
    });
    if (!note) return;
    try {
      await api.post(`/prospects/${prospect.id}/mark-contacted`, { note: note.trim() }, token);
      await reload({ silent: true });
      await modal.alert({
        title: t("prospects.markContactedTitle"),
        message: t("prospects.markContactedSuccess"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("prospects.statusUpdateError")),
        variant: "error",
      });
    }
  }

  async function handleLinkCalendly(calendlyEventId: number) {
    if (!token || !prospect) return;
    await api.post(`/prospects/${prospect.id}/link-calendly`, { calendly_event_id: calendlyEventId }, token);
    await reload({ silent: true });
    await modal.alert({
      title: t("prospects.linkCalendlySuccessTitle"),
      message: t("prospects.linkCalendlySuccessMessage"),
      variant: "success",
    });
  }

  async function handleLinkCalendlyAndMarkContacted(calendlyEventId: number) {
    if (!token || !prospect) return;
    try {
      await api.post(
        `/prospects/${prospect.id}/link-calendly`,
        { calendly_event_id: calendlyEventId },
        token,
      );
      await api.post(`/prospects/${prospect.id}/mark-contacted`, {}, token);
      await reload({ silent: true });
      await modal.alert({
        title: t("prospects.markContactedTitle"),
        message: t("prospects.markContactedSuccess"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("prospects.statusUpdateError")),
        variant: "error",
      });
      throw err;
    }
  }

  async function handleSendContract(payload: Parameters<typeof sendEnvelope>[0]) {
    if (!prospect) return;
    let successMessage: string | null = null;
    try {
      const result = await sendEnvelope({ ...payload, prospect_id: prospect.id });
      await reload({ silent: true });
      successMessage = result?.message ?? t("docusign.sendSuccessMessage");
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("docusign.sendError")),
        variant: "error",
      });
      throw err;
    }
    setContractOpen(false);
    // Después de que el modal de envío suelte el spinner y se desmonte.
    queueMicrotask(() => {
      void modal.alert({
        title: t("docusign.sendSuccessTitle"),
        message: successMessage ?? t("docusign.sendSuccessMessage"),
        variant: "success",
      });
    });
  }

  async function handleSendContractClick() {
    if (!prospect) return;
    if (prospect.docusign_envelopes.length > 0) {
      const confirmed = await modal.confirm({
        title: t("prospects.sendAnotherContractTitle"),
        message: t("prospects.sendAnotherContractConfirm", { name: prospect.full_name }),
        confirmLabel: t("prospects.sendAnotherContract"),
        cancelLabel: t("common.cancel"),
      });
      if (!confirmed) return;
    }
    setContractOpen(true);
  }

  async function handleCreatePaymentClick() {
    if (!prospect) return;
    const existingCount = prospect.payment_links?.length || (prospect.payment_link ? 1 : 0);
    if (existingCount > 0) {
      const confirmed = await modal.confirm({
        title: t("prospects.createAnotherPaymentTitle"),
        message: t("prospects.createAnotherPaymentConfirm", { name: prospect.full_name }),
        confirmLabel: t("prospects.createAnotherPaymentLink"),
        cancelLabel: t("common.cancel"),
      });
      if (!confirmed) return;
    }
    setPaymentOpen(true);
  }

  async function handleLinkPayment(paymentLinkId: number) {
    if (!token || !prospect) return;
    await api.post(`/prospects/${prospect.id}/link-payment`, { payment_link_id: paymentLinkId }, token);
    await reload({ silent: true });
    await modal.alert({
      title: t("prospects.linkPaymentSuccessTitle"),
      message: t("prospects.linkPaymentSuccessMessage"),
      variant: "success",
    });
  }

  async function openPaymentPicker() {
    if (!token || !prospect) return;
    try {
      const items = await fetchLinkablePaymentLinks(token, prospect.email);
      setLinkablePayments(items);
    } catch {
      setLinkablePayments([]);
    }
    setPaymentPickerOpen(true);
  }

  async function handleViewSigned(envelopeId: number) {
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

  async function handleViewSent(envelopeId: number) {
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

  async function handleCreatePayment(payload: Parameters<typeof createLink>[0]) {
    try {
      const result = await createLink(payload);
      setPaymentOpen(false);
      await reload({ silent: true });
      await copyToClipboard(result.link.payment_url);
      await modal.alert({
        title: result.email_sent
          ? t("payments.createSuccessEmailTitle")
          : t("payments.createSuccessTitle"),
        message: result.message || (
          result.email_sent
            ? t("payments.createSuccessEmailMessage", { email: payload.customer_email })
            : t("payments.createSuccessMessage")
        ),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("payments.createError")),
        variant: "error",
      });
    }
  }

  if (!idValid) {
    return (
      <>
        <Header title={t("prospects.detailHeaderContextLoading")} />
        <PageContent>
          <p className="text-sm text-slate-500">{t("prospects.notFound")}</p>
          <Link href="/prospectos" className="btn btn-secondary btn-sm mt-4">
            {t("common.back")}
          </Link>
        </PageContent>
      </>
    );
  }

  if (loading && !prospect) {
    return (
      <>
        <Header title={t("prospects.detailHeaderContextLoading")} subtitle={t("common.loading")} />
        <div className="flex flex-1 items-center justify-center py-24">
          <LoadingSpinner label={t("common.loading")} />
        </div>
      </>
    );
  }

  if (!prospect) {
    return (
      <>
        <Header title={t("prospects.detailHeaderContextLoading")} />
        <PageContent>
          <p className="text-sm text-slate-500">{t("prospects.notFound")}</p>
          <Link href="/prospectos" className="btn btn-secondary btn-sm mt-4">
            {t("common.back")}
          </Link>
        </PageContent>
      </>
    );
  }

  const salesRepName = prospect.assigned_to
    ? `${prospect.assigned_to.first_name} ${prospect.assigned_to.last_name}`
    : "—";

  const showContractAction =
    canUpdate && !isConverted && connection?.connected;

  const showPaymentAction = canUpdate && !isConverted;
  const canMarkContacted =
    canUpdate &&
    !isConverted &&
    (prospect.status === "PENDIENTE_CONTACTAR" ||
      (prospect.status === "PAGO_COMPLETADO" &&
        !sellerMarkedContacted(prospect.status, prospect.history ?? []))) &&
    (prospect.status === "PENDIENTE_CONTACTAR"
      ? allowedStatuses.includes("LEAD_CONTACTADO")
      : true);
  const contactHistory = findContactHistory(prospect.history ?? []);

  async function handleSaveBasic(e: FormEvent) {
    e.preventDefault();
    if (!token || !prospect || !editForm || !canEditBasic) return;
    setEditSubmitting(true);
    try {
      await api.patch(
        `/prospects/${prospect.id}`,
        {
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          source: editForm.source || undefined,
          notes: editForm.notes.trim(),
          is_qualified: editForm.is_qualified,
        },
        token,
      );
      await reload({ silent: true });
      setEditing(false);
      await modal.alert({
        title: locale === "en" ? "Prospect updated" : "Prospecto actualizado",
        message:
          locale === "en"
            ? "The basic details were saved successfully."
            : "Los datos básicos se guardaron correctamente.",
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(
          err,
          locale === "en"
            ? "Could not save prospect details"
            : "No se pudieron guardar los datos del prospecto",
        ),
        variant: "error",
      });
    } finally {
      setEditSubmitting(false);
    }
  }

  function startEditing() {
    if (!prospect) return;
    setEditForm(buildProspectForm(prospect));
    setEditing(true);
  }

  function cancelEditing() {
    if (prospect) setEditForm(buildProspectForm(prospect));
    setEditing(false);
  }

  return (
    <>
      <Header
        title={t("prospects.detailHeaderContext", { name: prospect.full_name })}
        subtitle={prospect.email}
      />
      <PageContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{prospect.full_name}</h2>
            <p className="text-sm text-slate-500">{prospect.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <ProspectStatusBadge status={prospect.status} />
              <ProspectQualificationBadge isQualified={prospect.is_qualified} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEditBasic && !editing ? (
              <Button size="sm" variant="secondary" onClick={startEditing}>
                {t("common.edit")}
              </Button>
            ) : null}
            {isConverted ? (
              <Link href={`/clientes/${prospect.converted_client_id}`} className="btn btn-primary btn-sm">
                {t("prospects.viewClient")}
              </Link>
            ) : null}
            <Link href="/prospectos" className="btn btn-secondary btn-sm">
              ← {t("common.back")}
            </Link>
          </div>
        </div>

        {isConverted ? (
          <div className="alert alert-info text-sm">{t("prospects.convertedHint")}</div>
        ) : null}

        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
            {editing ? t("prospects.editBasic") : t("prospects.overview")}
          </h2>

          {editing && editForm ? (
            <form onSubmit={(e) => void handleSaveBasic(e)} className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("common.firstName")}
                required
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              />
              <Input
                label={t("common.lastName")}
                required
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              />
              <Input
                label={t("common.email")}
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <Input
                label={t("common.phone")}
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <ClientSourceSelect
                value={editForm.source}
                onChange={(source) => setEditForm({ ...editForm, source })}
              />
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">{t("prospects.qualification")}</p>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={editForm.is_qualified ? "1" : "0"}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_qualified: e.target.value === "1" })
                  }
                >
                  <option value="1">{t("prospects.qualified")}</option>
                  <option value="0">{t("prospects.unqualified")}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  {t("common.notes")}
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </label>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                <p>
                  <span className="font-medium text-slate-700">{t("prospects.columns.merchant")}:</span>{" "}
                  {prospect.merchant_name ?? "—"}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-slate-700">{t("prospects.columns.salesRep")}:</span>{" "}
                  {salesRepName}
                </p>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={cancelEditing} disabled={editSubmitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={editSubmitting}>
                  {editSubmitting ? t("common.saving") : t("common.saveChanges")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label={t("common.email")} value={prospect.email} />
              <InfoRow label={t("common.phone")} value={prospect.phone} />
              <InfoRow label={t("prospects.columns.merchant")} value={prospect.merchant_name} />
              <InfoRow label={t("prospects.columns.salesRep")} value={salesRepName} />
              <InfoRow
                label={t("clients.source")}
                value={
                  prospect.source && prospect.source in CLIENT_SOURCE_LABEL_KEYS
                    ? t(CLIENT_SOURCE_LABEL_KEYS[prospect.source as ClientSourceValue])
                    : (prospect.source ?? "—")
                }
              />
              {prospect.source === "INFLUENCERS" ? (
                <InfoRow
                  label={t("influencers.title")}
                  value={prospect.influencer_name ?? "—"}
                />
              ) : null}
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="section-label">{t("prospects.qualification")}</p>
                <div className="mt-1">
                  <ProspectQualificationBadge isQualified={prospect.is_qualified} />
                </div>
              </div>
              {prospect.notes ? (
                <div className="sm:col-span-2 lg:col-span-3">
                  <InfoRow label={t("common.notes")} value={prospect.notes} />
                </div>
              ) : null}
            </div>
          )}
        </Card>

        {!isConverted ? (
          <ProspectLinkedResources
            locale={locale}
            prospectStatus={prospect.status}
            calendly={prospect.calendly_event}
            envelopes={prospect.docusign_envelopes}
            payment={prospect.payment_link}
            payments={prospect.payment_links ?? []}
            history={prospect.history ?? []}
            canManage={canUpdate}
            canMarkContacted={canMarkContacted}
            contactNote={contactHistory?.note ?? null}
            contactNoteBy={contactHistory?.changed_by_name ?? null}
            contactNoteAt={contactHistory?.created_at ?? null}
            onMarkContacted={() => void handleMarkContacted()}
            onLinkCalendly={() => setCalendlyOpen(true)}
            onSendContract={showContractAction ? () => void handleSendContractClick() : undefined}
            onViewContracts={
              prospect.docusign_envelopes.length > 0 ? () => setContractsListOpen(true) : undefined
            }
            onViewPayments={
              (prospect.payment_links?.length ?? 0) > 0 || prospect.payment_link
                ? () => setPaymentsListOpen(true)
                : undefined
            }
            onCreatePayment={showPaymentAction ? () => void handleCreatePaymentClick() : undefined}
            onLinkPayment={() => void openPaymentPicker()}
          />
        ) : null}

        {canUpdate && !isConverted ? (
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
              {t("prospects.addNote")}
            </h2>
            <form onSubmit={(e) => void handleAddNote(e)} className="space-y-3">
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t("prospects.notePlaceholder")}
                required
              />
              <Button type="submit" size="sm" disabled={!noteText.trim() || noteSubmitting}>
                {noteSubmitting ? t("common.loading") : t("prospects.addNoteAction")}
              </Button>
            </form>
          </Card>
        ) : null}

        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
            {t("prospects.history.title")}
          </h2>
          <ProspectHistoryTimeline history={prospect.history} locale={locale} />
        </Card>
      </PageContent>

      {calendlyOpen && prospect.assigned_to_user_id ? (
        <ProspectCalendlyLinkModal
          token={token}
          salesRepUserId={prospect.assigned_to_user_id}
          excludeEventId={prospect.calendly_event?.id}
          reschedule={!!prospect.calendly_event}
          onClose={() => setCalendlyOpen(false)}
          onLink={handleLinkCalendly}
        />
      ) : null}

      {markChoiceOpen ? (
        <Modal
          title={t("prospects.markContactedTitle")}
          onClose={() => setMarkChoiceOpen(false)}
        >
          <p className="text-sm text-slate-600">
            {t("prospects.markContactedNoMeetingHint", { name: prospect.full_name })}
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setMarkChoiceOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void startManualContactNote()}
            >
              {t("prospects.markContactedOtherChannel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMarkChoiceOpen(false);
                setCalendlyMarkContactedOpen(true);
              }}
            >
              {t("prospects.markContactedLinkMeeting")}
            </Button>
          </div>
        </Modal>
      ) : null}

      {calendlyMarkContactedOpen && prospect.assigned_to_user_id ? (
        <ProspectCalendlyLinkModal
          token={token}
          salesRepUserId={prospect.assigned_to_user_id}
          onlyUnlinked
          markContactedMode
          onClose={() => setCalendlyMarkContactedOpen(false)}
          onSkipToNote={() => void startManualContactNote()}
          onLink={handleLinkCalendlyAndMarkContacted}
        />
      ) : null}

      {contractOpen ? (
        <SendContractModal
          signerName={prospect.full_name}
          signerEmail={prospect.email}
          prospectId={prospect.id}
          prospect={{
            id: prospect.id,
            full_name: prospect.full_name,
            email: prospect.email,
            status: prospect.status,
          }}
          templates={templates}
          defaultTemplateId={connection?.default_template_id}
          defaultRoleName={connection?.default_template_role_name}
          onSearchClients={searchClients}
          onLoadTemplateDetail={loadTemplateDetail}
          onSubmit={handleSendContract}
          onClose={() => setContractOpen(false)}
        />
      ) : null}

      {paymentOpen ? (
        <Modal
          title={t("prospects.createPaymentLink")}
          subtitle={prospect.full_name}
          onClose={() => setPaymentOpen(false)}
          size="lg"
        >
          <PaymentLinkForm
            config={config}
            submitting={isCreating}
            onSubmit={handleCreatePayment}
            hideProspectSearch
            initialData={{
              customer_first_name: prospect.first_name,
              customer_last_name: prospect.last_name,
              customer_email: prospect.email,
              customer_phone: prospect.phone,
              prospect_id: prospect.id,
            }}
          />
        </Modal>
      ) : null}

      {contractsListOpen ? (
        <ProspectContractsModal
          envelopes={prospect.docusign_envelopes}
          locale={locale}
          onClose={() => setContractsListOpen(false)}
          onViewSigned={(id) => void handleViewSigned(id)}
          onViewSent={(id) => void handleViewSent(id)}
        />
      ) : null}

      {paymentsListOpen ? (
        <ProspectPaymentsModal
          payments={
            prospect.payment_links?.length
              ? prospect.payment_links
              : prospect.payment_link
                ? [prospect.payment_link]
                : []
          }
          locale={locale}
          onClose={() => setPaymentsListOpen(false)}
        />
      ) : null}

      {paymentPickerOpen ? (
        <ProspectExistingPaymentModal
          links={linkablePayments}
          prospectEmail={prospect.email}
          onClose={() => setPaymentPickerOpen(false)}
          onLink={handleLinkPayment}
        />
      ) : null}
    </>
  );
}
