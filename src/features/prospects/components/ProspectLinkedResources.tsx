"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import type {
  ProspectCalendlyBrief,
  ProspectEnvelopeBrief,
  ProspectPaymentBrief,
} from "@/features/prospects/types";

interface ProspectLinkedResourcesProps {
  locale: string;
  calendly: ProspectCalendlyBrief | null;
  envelopes: ProspectEnvelopeBrief[];
  payment: ProspectPaymentBrief | null;
  canManage: boolean;
  canMarkContacted?: boolean;
  onMarkContacted?: () => void;
  onLinkCalendly?: () => void;
  onLinkPayment?: () => void;
  onSendContract?: () => void;
  onCreatePayment?: () => void;
  onViewContracts?: () => void;
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

export function ProspectLinkedResources({
  locale,
  calendly,
  envelopes,
  payment,
  canManage,
  canMarkContacted = false,
  onMarkContacted,
  onLinkCalendly,
  onLinkPayment,
  onSendContract,
  onCreatePayment,
  onViewContracts,
}: ProspectLinkedResourcesProps) {
  const { t } = useTranslation();
  const latestEnvelope = envelopes[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t("prospects.linked.meeting")}
        </h3>
        {calendly ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-slate-900">{calendly.name}</p>
            <p className="text-slate-600">{formatDateTime(calendly.start_time, locale)}</p>
            {calendly.invitee_name || calendly.invitee_email ? (
              <p className="text-slate-500">
                {[calendly.invitee_name, calendly.invitee_email].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {calendly.meeting_url ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(calendly.meeting_url!, "_blank", "noopener,noreferrer")}
              >
                {t("calendly.joinMeeting")}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("prospects.linked.meetingEmpty")}</p>
        )}
        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {canMarkContacted && onMarkContacted ? (
              <Button size="sm" onClick={onMarkContacted}>
                {t("prospects.markContacted")}
              </Button>
            ) : null}
            {onLinkCalendly ? (
              <Button size="sm" variant="secondary" onClick={onLinkCalendly}>
                {calendly ? t("prospects.scheduleAnotherMeeting") : t("prospects.linkCalendlyAction")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t("prospects.linked.contract")}
        </h3>
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
          <div className="mt-4 flex flex-wrap gap-2">
            {envelopes.length > 0 && onViewContracts ? (
              <Button size="sm" variant="secondary" onClick={onViewContracts}>
                {t("prospects.viewSentContracts")}
              </Button>
            ) : null}
            {onSendContract ? (
              <Button size="sm" onClick={onSendContract}>
                {envelopes.length > 0 ? t("prospects.sendAnotherContract") : t("prospects.sendContract")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t("prospects.linked.payment")}
        </h3>
        {payment ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-slate-900">
              {payment.currency} {Number(payment.amount).toFixed(2)}
            </p>
            <p className="text-slate-600">{t(`payments.status.${payment.status}` as never)}</p>
            {payment.paid_at ? (
              <p className="text-slate-500">{formatDateTime(payment.paid_at, locale)}</p>
            ) : null}
            <Link
              href={payment.payment_url}
              target="_blank"
              className="text-sm font-medium text-brand hover:underline"
            >
              {t("payments.list.openLink")}
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("prospects.linked.paymentEmpty")}</p>
        )}
        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {onCreatePayment ? (
              <Button size="sm" onClick={onCreatePayment}>
                {t("prospects.createPaymentLink")}
              </Button>
            ) : null}
            {onLinkPayment ? (
              <Button size="sm" variant="secondary" onClick={onLinkPayment}>
                {t("prospects.linkExistingPayment")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
