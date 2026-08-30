"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import type { ProspectEnvelopeBrief } from "@/features/prospects/types";
import { formatDateTime } from "@/lib/format-datetime";

interface ProspectContractsModalProps {
  envelopes: ProspectEnvelopeBrief[];
  locale: string;
  onClose: () => void;
  onViewSigned: (envelopeId: number) => void;
  onViewSent: (envelopeId: number) => void;
  onResendReminder?: (envelopeId: number) => void;
  resendingId?: number | null;
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

function canViewSigned(status: string) {
  return status.toLowerCase() === "completed";
}

function canViewSent(status: string) {
  const normalized = status.toLowerCase();
  return normalized === "sent" || normalized === "delivered" || normalized === "completed";
}

export function ProspectContractsModal({
  envelopes,
  onClose,
  onViewSigned,
  onViewSent,
  onResendReminder,
  resendingId,
}: ProspectContractsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("prospects.contractsListTitle")}
      subtitle={t("prospects.contractsListSubtitle", { count: envelopes.length })}
      onClose={onClose}
      size="lg"
    >
      {envelopes.length === 0 ? (
        <p className="text-sm text-slate-500">{t("prospects.linked.contractEmpty")}</p>
      ) : (
        <ul className="max-h-[420px] space-y-3 overflow-y-auto">
          {envelopes.map((envelope) => (
            <li
              key={envelope.id}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{envelope.subject}</p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${envelopeStatusClass(envelope.status)}`}
                >
                  {t(envelopeStatusKey(envelope.status) as never)}
                </span>
              </div>
              <p className="mt-1 text-slate-600">
                {envelope.completed_at
                  ? t("prospects.linked.signedAt", {
                      date: formatDateTime(envelope.completed_at),
                    })
                  : t("prospects.linked.sentAt", {
                      date: formatDateTime(envelope.sent_at),
                    })}
              </p>
              <p className="text-slate-500">{envelope.signer_email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {canViewSigned(envelope.status) ? (
                  <Button size="sm" variant="secondary" onClick={() => onViewSigned(envelope.id)}>
                    {t("docusign.viewSigned")}
                  </Button>
                ) : null}
                {canViewSent(envelope.status) && !canViewSigned(envelope.status) ? (
                  <Button size="sm" variant="secondary" onClick={() => onViewSent(envelope.id)}>
                    {t("docusign.viewSent")}
                  </Button>
                ) : null}
                {onResendReminder &&
                ["sent", "delivered", "created"].includes(envelope.status.toLowerCase()) ? (
                  <Button
                    size="sm"
                    disabled={resendingId === envelope.id}
                    onClick={() => onResendReminder(envelope.id)}
                  >
                    {resendingId === envelope.id
                      ? t("prospects.sendingContractReminder")
                      : t("prospects.sendContractReminder")}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
