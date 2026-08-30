"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import type { DocusignEnvelope } from "@/features/docusign/types";
import type { PaymentLink } from "@/features/payments/types";
import { formatDateTime } from "@/lib/format-datetime";

interface ProspectExistingEnvelopeModalProps {
  envelopes: DocusignEnvelope[];
  prospectEmail: string;
  onClose: () => void;
  onLink: (envelopeId: number) => Promise<void>;
}

export function ProspectExistingEnvelopeModal({
  envelopes,
  prospectEmail,
  onClose,
  onLink,
}: ProspectExistingEnvelopeModalProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const candidates = envelopes.filter(
    (envelope) =>
      envelope.signer_email.toLowerCase() === prospectEmail.toLowerCase() && !envelope.prospect_id,
  );

  async function handleSubmit() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await onLink(selectedId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t("prospects.linkExistingContract")} onClose={onClose} size="lg">
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500">{t("prospects.linkExistingContractEmpty")}</p>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {candidates.map((envelope) => (
            <label
              key={envelope.id}
              className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm ${
                selectedId === envelope.id ? "border-brand bg-brand/5" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="envelope-link"
                checked={selectedId === envelope.id}
                onChange={() => setSelectedId(envelope.id)}
              />
              <div>
                <p className="font-medium text-slate-900">{envelope.subject}</p>
                <p className="text-slate-600">{envelope.signer_email}</p>
                <p className="text-slate-500">{formatDateTime(envelope.sent_at)}</p>
              </div>
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="button" disabled={!selectedId || submitting} onClick={() => void handleSubmit()}>
          {submitting ? t("common.loading") : t("prospects.linkPickerConfirm")}
        </Button>
      </div>
    </Modal>
  );
}

interface ProspectExistingPaymentModalProps {
  links: PaymentLink[];
  prospectEmail: string;
  onClose: () => void;
  onLink: (paymentLinkId: number) => Promise<void>;
}

export function ProspectExistingPaymentModal({
  links,
  prospectEmail,
  onClose,
  onLink,
}: ProspectExistingPaymentModalProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const candidates = links.filter(
    (link) =>
      link.customer_email.toLowerCase() === prospectEmail.toLowerCase() &&
      (link.status === "pending" || link.status === "partial") &&
      !link.prospect_id,
  );

  async function handleSubmit() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await onLink(selectedId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t("prospects.linkExistingPayment")} onClose={onClose} size="lg">
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500">{t("prospects.linkExistingPaymentEmpty")}</p>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {candidates.map((link) => (
            <label
              key={link.id}
              className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm ${
                selectedId === link.id ? "border-brand bg-brand/5" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="payment-link"
                checked={selectedId === link.id}
                onChange={() => setSelectedId(link.id)}
              />
              <div>
                <p className="font-medium text-slate-900">
                  {link.customer_first_name} {link.customer_last_name}
                </p>
                <p className="text-slate-600">
                  {link.currency} {Number(link.amount).toFixed(2)}
                </p>
                <p className="text-slate-500">{t(`payments.status.${link.status}` as never)}</p>
              </div>
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="button" disabled={!selectedId || submitting} onClick={() => void handleSubmit()}>
          {submitting ? t("common.loading") : t("prospects.linkPickerConfirm")}
        </Button>
      </div>
    </Modal>
  );
}
