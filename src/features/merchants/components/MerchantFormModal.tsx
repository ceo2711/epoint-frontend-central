"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { MerchantForm } from "@/features/merchants/components/MerchantForm";
import { EMPTY_MERCHANT_FORM, type Merchant, type MerchantFormData } from "@/features/merchants/types";
import { ApiError, api } from "@/lib/api";

interface MerchantFormModalProps {
  token: string | null;
  merchant?: Merchant | null;
  onClose: () => void;
  onSuccess: () => void;
}

function merchantToForm(merchant: Merchant): MerchantFormData {
  return {
    code: merchant.code,
    name: merchant.name,
    description: merchant.description ?? "",
  };
}

export function MerchantFormModal({ token, merchant, onClose, onSuccess }: MerchantFormModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const isEdit = !!merchant;
  const [form, setForm] = useState<MerchantFormData>(
    merchant ? merchantToForm(merchant) : EMPTY_MERCHANT_FORM,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      if (isEdit && merchant) {
        await api.patch(
          `/merchants/${merchant.id}`,
          { name: form.name, description: form.description || null },
          token,
        );
      } else {
        await api.post(
          "/merchants",
          { code: form.code, name: form.name, description: form.description || null },
          token,
        );
      }
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
      title={isEdit ? t("merchants.edit") : t("merchants.new")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="merchant-form-modal" disabled={submitting}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      }
    >
      <MerchantForm
        embedded
        formId="merchant-form-modal"
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEdit={isEdit}
      />
    </Modal>
  );
}
