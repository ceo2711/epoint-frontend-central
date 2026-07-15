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
  envelope: ProspectEnvelopeBrief | null;
  payment: ProspectPaymentBrief | null;
  canManage: boolean;
  onLinkCalendly?: () => void;
  onLinkEnvelope?: () => void;
  onLinkPayment?: () => void;
  onSendContract?: () => void;
  onCreatePayment?: () => void;
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
  if (normalized === "sent" || normalized === "delivered") return "docusign.statusSent";
  return "docusign.statusUnknown";
}

export function ProspectLinkedResources({
  locale,
  calendly,
  envelope,
  payment,
  canManage,
  onLinkCalendly,
  onLinkEnvelope,
  onLinkPayment,
  onSendContract,
  onCreatePayment,
}: ProspectLinkedResourcesProps) {
  const { t } = useTranslation();

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
        {canManage && onLinkCalendly ? (
          <Button size="sm" variant="secondary" className="mt-4" onClick={onLinkCalendly}>
            {calendly ? t("prospects.linkCalendlyAgain") : t("prospects.linkCalendlyAction")}
          </Button>
        ) : null}
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t("prospects.linked.contract")}
        </h3>
        {envelope ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-slate-900">{envelope.subject}</p>
            <p className="text-slate-600">
              {t(envelopeStatusKey(envelope.status) as never)}
              {envelope.completed_at
                ? ` · ${formatDateTime(envelope.completed_at, locale)}`
                : ` · ${t("prospects.linked.sentAt", { date: formatDateTime(envelope.sent_at, locale) })}`}
            </p>
            <p className="text-slate-500">{envelope.signer_email}</p>
            {envelope.status.toLowerCase() === "completed" ? (
              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                {t("prospects.linked.contractSigned")}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("prospects.linked.contractEmpty")}</p>
        )}
        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {onSendContract ? (
              <Button size="sm" onClick={onSendContract}>
                {t("prospects.sendContract")}
              </Button>
            ) : null}
            {onLinkEnvelope ? (
              <Button size="sm" variant="secondary" onClick={onLinkEnvelope}>
                {t("prospects.linkExistingContract")}
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
