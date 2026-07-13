"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientCreateForm } from "@/features/clients/components/ClientCreateForm";
import { useClientAvailabilityCheck } from "@/features/clients/hooks/useClientAvailabilityCheck";
import { EMPTY_CLIENT_FORM } from "@/features/clients/types";
import type { ClientFormData } from "@/features/clients/types";
import { formatClientConflict } from "@/features/clients/utils";
import type { MerchantBrief } from "@/types/api";
import { ApiError, api } from "@/lib/api";
import { emitClientsRefresh } from "@/lib/clientEvents";

interface ClientCreateModalProps {
  token: string | null;
  merchants: MerchantBrief[];
  merchantsLoading?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientCreateModal({
  token,
  merchants,
  merchantsLoading,
  onClose,
  onSuccess,
}: ClientCreateModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const [form, setForm] = useState<ClientFormData>(EMPTY_CLIENT_FORM);
  const [submitting, setSubmitting] = useState(false);
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
    form.first_name &&
    form.last_name &&
    form.email &&
    form.phone &&
    form.source &&
    form.merchant_id;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || hasConflict || !formComplete) return;
    setSubmitting(true);
    try {
      const merchantId = Number(form.merchant_id);
      await api.post(
        "/clients",
        {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          source: form.source,
          merchant_id: merchantId,
        },
        token,
      );
      emitClientsRefresh({ merchantId, showAllMerchants: true });
      onSuccess();
      onClose();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={t("clients.newClient")}
      subtitle={t("clients.createModalSubtitle")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="client-create-form"
            disabled={submitting || checking || hasConflict || !formComplete}
          >
            {submitting ? t("common.loading") : t("clients.saveClient")}
          </Button>
        </div>
      }
    >
      <ClientCreateForm
        embedded
        form={form}
        merchants={merchants}
        merchantsLoading={merchantsLoading}
        onChange={setForm}
        onSubmit={handleCreate}
        submitting={submitting}
        checking={checking}
        hasConflict={hasConflict}
        emailError={emailError}
        phoneError={phoneError}
      />
    </Modal>
  );
}
