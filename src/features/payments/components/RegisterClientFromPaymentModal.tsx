"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientSourceSelect } from "@/features/clients/components/ClientSourceSelect";
import type { PaymentLink } from "@/features/payments/types";
import type { MerchantBrief } from "@/types/api";

interface RegisterClientFromPaymentModalProps {
  link: PaymentLink | null;
  merchants: MerchantBrief[];
  merchantsLoading?: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (merchantId: number, source: string) => Promise<void>;
}

export function RegisterClientFromPaymentModal({
  link,
  merchants,
  merchantsLoading,
  submitting,
  onClose,
  onSubmit,
}: RegisterClientFromPaymentModalProps) {
  const { t } = useTranslation();
  const [merchantId, setMerchantId] = useState("");
  const [source, setSource] = useState("OTHER");

  if (!link) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!merchantId) return;
    await onSubmit(Number(merchantId), source);
  }

  return (
    <Modal
      title={t("payments.register.title")}
      subtitle={t("payments.register.subtitle", {
        name: `${link.customer_first_name} ${link.customer_last_name}`,
        email: link.customer_email,
      })}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="register-client-from-payment" disabled={submitting || !merchantId}>
            {submitting ? t("changePassword.saving") : t("payments.register.submit")}
          </Button>
        </div>
      }
    >
      <form id="register-client-from-payment" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("clients.merchant")}</label>
          <select
            className="input-field w-full"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            required
            disabled={merchantsLoading}
          >
            <option value="">{t("clients.selectMerchant")}</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <ClientSourceSelect value={source} onChange={setSource} required />
      </form>
    </Modal>
  );
}
