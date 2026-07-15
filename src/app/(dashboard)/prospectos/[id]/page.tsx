"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SendContractForm } from "@/features/docusign/components/SendContractForm";
import { useDocusign } from "@/features/docusign/hooks/useDocusign";
import { PaymentLinkForm } from "@/features/payments/components/PaymentLinkForm";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { ProspectCalendlyLinkModal } from "@/features/prospects/components/ProspectCalendlyLinkModal";
import {
  ProspectExistingEnvelopeModal,
  ProspectExistingPaymentModal,
} from "@/features/prospects/components/ProspectExistingResourceModals";
import { ProspectHistoryTimeline } from "@/features/prospects/components/ProspectHistoryTimeline";
import { ProspectLinkedResources } from "@/features/prospects/components/ProspectLinkedResources";
import { ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import { useProspectDetail } from "@/features/prospects/hooks/useProspects";
import { getAllowedNextStatuses } from "@/features/prospects/utils/transitions";
import type { ProspectStatus } from "@/features/prospects/types";
import { api } from "@/lib/api";

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
  const rawId = params.id;
  const id = typeof rawId === "string" ? Number(rawId) : NaN;
  const idValid = Number.isFinite(id) && id > 0;

  const { token, hasPermission } = useAuth();
  const { t, locale } = useTranslation();
  const modal = useModal();
  const { prospect, loading, reload } = useProspectDetail(token, idValid ? id : 0);

  const [statusTarget, setStatusTarget] = useState<ProspectStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [envelopePickerOpen, setEnvelopePickerOpen] = useState(false);
  const [paymentPickerOpen, setPaymentPickerOpen] = useState(false);

  const canUpdate = hasPermission("prospects:update");
  const isConverted = !!prospect?.converted_client_id;
  const allowedStatuses = prospect ? getAllowedNextStatuses(prospect.status) : [];

  const {
    connection,
    templates,
    envelopes,
    sendEnvelope,
    searchClients,
    loadTemplateDetail,
  } = useDocusign(token);

  const { config, links, createLink, isCreating } = usePayments(token);

  async function handleStatusUpdate(e: FormEvent) {
    e.preventDefault();
    if (!token || !prospect || !statusTarget || !canUpdate) return;
    setStatusSubmitting(true);
    try {
      await api.post(
        `/prospects/${prospect.id}/status`,
        { status: statusTarget, note: statusNote.trim() || undefined },
        token,
      );
      setStatusTarget("");
      setStatusNote("");
      await reload();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("prospects.statusUpdateError")),
        variant: "error",
      });
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!token || !prospect || !noteText.trim() || !canUpdate) return;
    setNoteSubmitting(true);
    try {
      await api.post(`/prospects/${prospect.id}/notes`, { note: noteText.trim() }, token);
      setNoteText("");
      await reload();
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

  async function handleLinkCalendly(calendlyEventId: number) {
    if (!token || !prospect) return;
    await api.post(`/prospects/${prospect.id}/link-calendly`, { calendly_event_id: calendlyEventId }, token);
    await reload();
    await modal.alert({
      title: t("prospects.linkCalendlySuccessTitle"),
      message: t("prospects.linkCalendlySuccessMessage"),
      variant: "success",
    });
  }

  async function handleSendContract(payload: Parameters<typeof sendEnvelope>[0]) {
    try {
      const result = await sendEnvelope(payload);
      setContractOpen(false);
      await reload();
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

  async function handleLinkEnvelope(envelopeId: number) {
    if (!token || !prospect) return;
    await api.post(`/prospects/${prospect.id}/link-envelope`, { envelope_id: envelopeId }, token);
    await reload();
    await modal.alert({
      title: t("prospects.linkContractSuccessTitle"),
      message: t("prospects.linkContractSuccessMessage"),
      variant: "success",
    });
  }

  async function handleLinkPayment(paymentLinkId: number) {
    if (!token || !prospect) return;
    await api.post(`/prospects/${prospect.id}/link-payment`, { payment_link_id: paymentLinkId }, token);
    await reload();
    await modal.alert({
      title: t("prospects.linkPaymentSuccessTitle"),
      message: t("prospects.linkPaymentSuccessMessage"),
      variant: "success",
    });
  }

  async function handleCreatePayment(payload: Parameters<typeof createLink>[0]) {
    try {
      const result = await createLink(payload);
      setPaymentOpen(false);
      await reload();
      await navigator.clipboard.writeText(result.link.payment_url);
      await modal.alert({
        title: t("payments.createSuccessTitle"),
        message: t("payments.createSuccessMessage"),
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
        <Header title={t("prospects.detailTitle")} />
        <PageContent>
          <p className="text-sm text-slate-500">{t("prospects.notFound")}</p>
          <Link href="/prospectos" className="btn btn-secondary btn-sm mt-4">
            {t("common.back")}
          </Link>
        </PageContent>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header title={t("prospects.detailTitle")} subtitle={t("common.loading")} />
        <div className="flex flex-1 items-center justify-center py-24">
          <LoadingSpinner label={t("common.loading")} />
        </div>
      </>
    );
  }

  if (!prospect) {
    return (
      <>
        <Header title={t("prospects.detailTitle")} />
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

  return (
    <>
      <Header
        title={t("prospects.detailTitle")}
        subtitle={prospect.full_name}
      />
      <PageContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{prospect.full_name}</h2>
            <p className="text-sm text-slate-500">{prospect.email}</p>
            <div className="mt-2">
              <ProspectStatusBadge status={prospect.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
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
            {t("prospects.overview")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label={t("common.email")} value={prospect.email} />
            <InfoRow label={t("common.phone")} value={prospect.phone} />
            <InfoRow label={t("prospects.columns.merchant")} value={prospect.merchant_name} />
            <InfoRow label={t("prospects.columns.salesRep")} value={salesRepName} />
            <InfoRow label={t("clients.source")} value={prospect.source ?? "—"} />
            {prospect.notes ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <InfoRow label={t("common.notes")} value={prospect.notes} />
              </div>
            ) : null}
          </div>
        </Card>

        {!isConverted ? (
          <ProspectLinkedResources
            locale={locale}
            calendly={prospect.calendly_event}
            envelope={prospect.docusign_envelope}
            payment={prospect.payment_link}
            canManage={canUpdate}
            onLinkCalendly={() => setCalendlyOpen(true)}
            onSendContract={showContractAction ? () => setContractOpen(true) : undefined}
            onLinkEnvelope={() => setEnvelopePickerOpen(true)}
            onCreatePayment={showPaymentAction ? () => setPaymentOpen(true) : undefined}
            onLinkPayment={() => setPaymentPickerOpen(true)}
          />
        ) : null}

        {canUpdate && !isConverted && allowedStatuses.length > 0 ? (
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
              {t("prospects.updateStatus")}
            </h2>
            <form onSubmit={(e) => void handleStatusUpdate(e)} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  {t("prospects.newStatus")}
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={statusTarget}
                    onChange={(e) => setStatusTarget(e.target.value as ProspectStatus)}
                    required
                  >
                    <option value="">{t("prospects.selectStatus")}</option>
                    {allowedStatuses.map((status) => (
                      <option key={status} value={status}>
                        {t(`prospects.status.${status}` as never)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                  {t("prospects.statusNote")}
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={2}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder={t("prospects.statusNotePlaceholder")}
                  />
                </label>
              </div>
              <Button type="submit" size="sm" disabled={!statusTarget || statusSubmitting}>
                {statusSubmitting ? t("common.loading") : t("prospects.updateStatusAction")}
              </Button>
            </form>
          </Card>
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
          onClose={() => setCalendlyOpen(false)}
          onLink={handleLinkCalendly}
        />
      ) : null}

      {contractOpen ? (
        <Modal
          title={t("prospects.sendContract")}
          subtitle={prospect.full_name}
          onClose={() => setContractOpen(false)}
          size="lg"
        >
          <SendContractForm
            embedded
            hideClientSearch
            templates={templates}
            initialSigner={{
              name: prospect.full_name,
              email: prospect.email,
              prospectId: prospect.id,
            }}
            onSearchClients={searchClients}
            onLoadTemplateDetail={loadTemplateDetail}
            onSubmit={handleSendContract}
          />
        </Modal>
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

      {envelopePickerOpen ? (
        <ProspectExistingEnvelopeModal
          envelopes={envelopes}
          prospectEmail={prospect.email}
          onClose={() => setEnvelopePickerOpen(false)}
          onLink={handleLinkEnvelope}
        />
      ) : null}

      {paymentPickerOpen ? (
        <ProspectExistingPaymentModal
          links={links}
          prospectEmail={prospect.email}
          onClose={() => setPaymentPickerOpen(false)}
          onLink={handleLinkPayment}
        />
      ) : null}
    </>
  );
}
