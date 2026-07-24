"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { InfluencerForm } from "@/features/influencers/components/InfluencerForm";
import {
  EMPTY_INFLUENCER_FORM,
  type Influencer,
  type InfluencerFormData,
} from "@/features/influencers/types";
import type { Sede } from "@/types/api";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface InfluencerFormModalProps {
  token: string | null;
  influencer?: Influencer | null;
  salesReps: CalendlySalesRep[];
  sedes?: Sede[];
  showSedeSelect?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function toForm(influencer: Influencer): InfluencerFormData {
  return {
    name: influencer.name,
    handle: influencer.handle ?? "",
    notes: influencer.notes ?? "",
    sales_rep_user_id: String(influencer.sales_rep_user_id),
    sede_id: String(influencer.sede_id),
  };
}

export function InfluencerFormModal({
  token,
  influencer,
  salesReps,
  sedes = [],
  showSedeSelect = false,
  onClose,
  onSuccess,
}: InfluencerFormModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const isEdit = !!influencer;
  const [form, setForm] = useState<InfluencerFormData>(
    influencer ? toForm(influencer) : EMPTY_INFLUENCER_FORM,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !form.sales_rep_user_id) return;
    setSubmitting(true);
    try {
      if (isEdit && influencer) {
        await api.patch(
          `/influencers/${influencer.id}`,
          {
            name: form.name,
            handle: form.handle || null,
            notes: form.notes || null,
            sales_rep_user_id: Number(form.sales_rep_user_id),
          },
          token,
        );
      } else {
        await api.post(
          "/influencers",
          {
            name: form.name,
            handle: form.handle || null,
            notes: form.notes || null,
            sales_rep_user_id: Number(form.sales_rep_user_id),
            sede_id: showSedeSelect && form.sede_id ? Number(form.sede_id) : undefined,
          },
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
      title={isEdit ? t("influencers.edit") : t("influencers.new")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="influencer-form-modal" disabled={submitting}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      }
    >
      <InfluencerForm
        formId="influencer-form-modal"
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEdit={isEdit}
        salesReps={salesReps}
        sedes={sedes}
        showSedeSelect={showSedeSelect}
      />
    </Modal>
  );
}
