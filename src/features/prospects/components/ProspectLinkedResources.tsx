"use client";

import Link from "next/link";
import { useState } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import type {
  ProspectCalendlyBrief,
  ProspectEnvelopeBrief,
  ProspectPaymentBrief,
  ProspectStatus,
} from "@/features/prospects/types";
import { copyToClipboard } from "@/lib/clipboard";
import {
  isContractStepComplete,
  isMeetingStepComplete,
  isPaymentStepComplete,
  isReadyForClientConversion,
  pickPreferredPayment,
} from "@/features/prospects/utils/pipeline";

interface ProspectLinkedResourcesProps {
  locale: string;
  prospectStatus: ProspectStatus;
  calendly: ProspectCalendlyBrief | null;
  envelopes: ProspectEnvelopeBrief[];
  payment: ProspectPaymentBrief | null;
  payments?: ProspectPaymentBrief[];
  canManage: boolean;
  /** Vista de cliente convertido: sin banner de conversión, sin unirse a reunión, copiar link de pago. */
  clientView?: boolean;
  canMarkContacted?: boolean;
  onMarkContacted?: () => void;
  onLinkCalendly?: () => void;
  onLinkPayment?: () => void;
  onSendContract?: () => void;
  onCreatePayment?: () => void;
  onViewContracts?: () => void;
  onViewPayments?: () => void;
}

function formatDateTime(value: string, locale: string) {
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function envelopeStatusKey(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "docusign.statusCompleted";
  if (normalized === "declined") return "docusign.statusDeclined";
  if (normalized === "voided") return "docusign.statusVoided";
  if (normalized === "delivered") return "docusign.statusDelivered";
  if (normalized === "sent") return "docusign.statusSent";
  return "docusign.statusUnknown";
}

function envelopeStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "bg-emerald-100 text-emerald-800";
  if (normalized === "declined" || normalized === "voided") return "bg-red-100 text-red-800";
  if (normalized === "sent" || normalized === "delivered") return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-800";
}

function StepHeader({ title, completed, completedLabel }: { title: string; completed: boolean; completedLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{title}</h3>
      {completed ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
          title={completedLabel}
        >
          <HiOutlineCheckCircle className="h-4 w-4" aria-hidden />
          <span className="sr-only">{completedLabel}</span>
        </span>
      ) : (
        <span
          className="inline-flex h-5 w-5 shrink-0 rounded-full border-2 border-slate-200"
          aria-hidden
        />
      )}
    </div>
  );
}

function stepCardClass(completed: boolean) {
  return completed ? "p-4 sm:p-5 ring-2 ring-emerald-200/80 bg-emerald-50/30" : "p-4 sm:p-5";
}

export function ProspectLinkedResources({
  locale,
  prospectStatus,
  calendly,
  envelopes,
  payment,
  payments = [],
  canManage,
  clientView = false,
  canMarkContacted = false,
  onMarkContacted,
  onLinkCalendly,
  onLinkPayment,
  onSendContract,
  onCreatePayment,
  onViewContracts,
  onViewPayments,
}: ProspectLinkedResourcesProps) {
  const { t } = useTranslation();
  const [paymentLinkCopied, setPaymentLinkCopied] = useState(false);
  const latestEnvelope = envelopes[0] ?? null;
  const paymentLinks = payments.length > 0 ? payments : payment ? [payment] : [];
  const displayPayment = pickPreferredPayment(payment, paymentLinks);
  const meetingComplete = isMeetingStepComplete(calendly, prospectStatus);
  const contractComplete = isContractStepComplete(envelopes);
  const paymentComplete = isPaymentStepComplete(displayPayment, paymentLinks);
  const readyForConversion = isReadyForClientConversion(
    calendly,
    prospectStatus,
    envelopes,
    displayPayment,
    paymentLinks,
  );
  const showViewContracts =
    envelopes.length > 0 && onViewContracts && (canManage || clientView);
  const showViewPayments =
    paymentLinks.length > 0 && onViewPayments && (canManage || clientView);
  const createPaymentLabel =
    paymentLinks.length > 0 ? t("prospects.createAnotherPaymentLink") : t("prospects.createPaymentLink");

  async function handleCopyPaymentLink() {
    if (!displayPayment?.payment_url) return;
    const ok = await copyToClipboard(displayPayment.payment_url);
    if (!ok) return;
    setPaymentLinkCopied(true);
    window.setTimeout(() => setPaymentLinkCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {readyForConversion && !clientView ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {t("prospects.linked.allStepsComplete")}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={stepCardClass(meetingComplete)}>
          <StepHeader
            title={t("prospects.linked.meeting")}
            completed={meetingComplete}
            completedLabel={t("prospects.linked.stepCompleted")}
          />
          {calendly ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold text-slate-900">{calendly.name}</p>
              <p className="text-slate-600">{formatDateTime(calendly.start_time, locale)}</p>
              {calendly.invitee_name || calendly.invitee_email ? (
                <p className="text-slate-500">
                  {[calendly.invitee_name, calendly.invitee_email].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {calendly.meeting_url && !clientView ? (
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => window.open(calendly.meeting_url!, "_blank", "noopener,noreferrer")}
                >
                  {t("calendly.joinMeeting")}
                </Button>
              ) : null}
              {!meetingComplete ? (
                <p className="text-xs text-amber-700">{t("prospects.linked.meetingPendingContact")}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t("prospects.linked.meetingEmpty")}</p>
          )}
          {canManage ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {canMarkContacted && onMarkContacted ? (
                <Button size="xs" onClick={onMarkContacted}>
                  {t("prospects.markContacted")}
                </Button>
              ) : null}
              {onLinkCalendly ? (
                <Button size="xs" variant="secondary" onClick={onLinkCalendly}>
                  {calendly ? t("prospects.scheduleAnotherMeeting") : t("prospects.linkCalendlyAction")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </Card>

        <Card className={stepCardClass(contractComplete)}>
          <StepHeader
            title={t("prospects.linked.contract")}
            completed={contractComplete}
            completedLabel={t("prospects.linked.stepCompleted")}
          />
          {latestEnvelope ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{latestEnvelope.subject}</p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${envelopeStatusClass(latestEnvelope.status)}`}
                >
                  {t(envelopeStatusKey(latestEnvelope.status) as never)}
                </span>
              </div>
              <p className="text-slate-600">
                {latestEnvelope.completed_at
                  ? t("prospects.linked.signedAt", {
                      date: formatDateTime(latestEnvelope.completed_at, locale),
                    })
                  : t("prospects.linked.sentAt", {
                      date: formatDateTime(latestEnvelope.sent_at, locale),
                    })}
              </p>
              <p className="text-slate-500">{latestEnvelope.signer_email}</p>
              {envelopes.length > 1 ? (
                <p className="text-xs text-slate-500">
                  {t("prospects.linked.moreContracts", { count: envelopes.length - 1 })}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t("prospects.linked.contractEmpty")}</p>
          )}
          {canManage ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {showViewContracts ? (
                <Button size="xs" variant="secondary" onClick={onViewContracts}>
                  {t("prospects.viewSentContracts")}
                </Button>
              ) : null}
              {onSendContract ? (
                <Button size="xs" onClick={onSendContract}>
                  {envelopes.length > 0 ? t("prospects.sendAnotherContract") : t("prospects.sendContract")}
                </Button>
              ) : null}
            </div>
          ) : showViewContracts ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Button size="xs" variant="secondary" onClick={onViewContracts}>
                {t("prospects.viewSentContracts")}
              </Button>
            </div>
          ) : null}
        </Card>

        <Card className={stepCardClass(paymentComplete)}>
          <StepHeader
            title={t("prospects.linked.payment")}
            completed={paymentComplete}
            completedLabel={t("prospects.linked.stepCompleted")}
          />
          {displayPayment ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold text-slate-900">
                {displayPayment.currency} {Number(displayPayment.amount).toFixed(2)}
              </p>
              <p className="text-slate-600">{t(`payments.status.${displayPayment.status}` as never)}</p>
              {displayPayment.paid_at ? (
                <p className="text-slate-500">{formatDateTime(displayPayment.paid_at, locale)}</p>
              ) : null}
              {paymentLinks.length > 1 ? (
                <p className="text-xs text-slate-500">
                  {t("prospects.linked.morePayments", { count: paymentLinks.length - 1 })}
                </p>
              ) : null}
              {clientView ? (
                <Button size="xs" variant="secondary" onClick={() => void handleCopyPaymentLink()}>
                  {paymentLinkCopied ? t("common.copied") : t("payments.list.copyLink")}
                </Button>
              ) : displayPayment.status.toLowerCase() === "pending" ? (
                <Link
                  href={displayPayment.payment_url}
                  target="_blank"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {t("payments.list.openLink")}
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t("prospects.linked.paymentEmpty")}</p>
          )}
          {canManage ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {showViewPayments ? (
                <Button size="xs" variant="secondary" onClick={onViewPayments}>
                  {t("prospects.viewSentPayments")}
                </Button>
              ) : null}
              {onCreatePayment ? (
                <Button size="xs" onClick={onCreatePayment}>
                  {createPaymentLabel}
                </Button>
              ) : null}
              {onLinkPayment ? (
                <Button size="xs" variant="secondary" onClick={onLinkPayment}>
                  {t("prospects.linkExistingPayment")}
                </Button>
              ) : null}
            </div>
          ) : showViewPayments ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Button size="xs" variant="secondary" onClick={onViewPayments}>
                {t("prospects.viewSentPayments")}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
