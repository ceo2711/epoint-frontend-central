"use client";

import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientSourceSelect } from "@/features/clients/components/ClientSourceSelect";
import { MerchantSelect } from "@/features/clients/components/MerchantSelect";
import { formatClientConflict, useClientAvailabilityCheck } from "@/features/clients/hooks/useClientAvailabilityCheck";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import type { DocusignEnvelope, DocusignRegisterClientPayload } from "@/features/docusign/types";
import { parseSignerName } from "@/features/docusign/utils";

interface RegisterClientFromContractModalProps {
  envelope: DocusignEnvelope;
  token: string | null;
  onSubmit: (envelopeId: number, payload: DocusignRegisterClientPayload) => Promise<void>;
  onClose: () => void;
}

export function RegisterClientFromContractModal({
  envelope,
  token,
  onSubmit,
  onClose,
}: RegisterClientFromContractModalProps) {
  const { t } = useTranslation();
  const parsedName = useMemo(() => parseSignerName(envelope.signer_name), [envelope.signer_name]);
  const [form, setForm] = useState({
    first_name: parsedName.firstName,
    last_name: parsedName.lastName,
    email: envelope.signer_email,
    phone: "",
    source: "",
    merchant_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { merchants, loading: merchantsLoading } = useMerchantOptions(token, true);
  const { availability, checking, hasConflict } = useClientAvailabilityCheck(
    token,
    form.email,
    form.phone,
    { enabled: true },
  );

  const emailError = availability?.email
    ? formatClientConflict(t, "email", availability.email)
    : undefined;
  const phoneError = availability?.phone
    ? formatClientConflict(t, "phone", availability.phone)
    : undefined;

  const formComplete =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.source &&
    form.merchant_id;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formComplete || hasConflict || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(envelope.id, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        source: form.source,
        merchant_id: Number(form.merchant_id),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={t("docusign.registerClientTitle")}
      subtitle={t("docusign.registerClientSubtitle", { signer: envelope.signer_name })}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="register-client-from-contract"
            disabled={submitting || checking || hasConflict || !formComplete}
          >
            {submitting ? t("docusign.registerClientSubmitting") : t("docusign.registerClientAction")}
          </Button>
        </div>
      }
    >
      <form id="register-client-from-contract" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm text-slate-600">{t("docusign.registerClientHint")}</p>
        <Input
          label={t("common.firstName")}
          required
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <Input
          label={t("common.lastName")}
          required
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <Input
          label={t("common.email")}
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={emailError}
        />
        <Input
          label={t("common.phone")}
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          error={phoneError}
          placeholder="1131432490"
        />
        <ClientSourceSelect
          value={form.source}
          onChange={(source) => setForm({ ...form, source })}
          required
        />
        <MerchantSelect
          merchants={merchants}
          value={form.merchant_id}
          onChange={(merchant_id) => setForm({ ...form, merchant_id })}
          required
          loading={merchantsLoading}
        />
        {checking ? (
          <p className="text-xs text-slate-400 sm:col-span-2">{t("clients.checkingAvailability")}</p>
        ) : null}
      </form>
    </Modal>
  );
}
