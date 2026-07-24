"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SourceForm } from "@/features/sources/components/SourceForm";
import { EMPTY_SOURCE_FORM, type Source, type SourceFormData } from "@/features/sources/types";
import { api } from "@/lib/api";

interface SourceFormModalProps {
  token: string | null;
  source?: Source | null;
  onClose: () => void;
  onSuccess: () => void;
}

function sourceToForm(source: Source): SourceFormData {
  return {
    code: source.code,
    name: source.name,
    description: source.description ?? "",
    sort_order: source.sort_order,
  };
}

export function SourceFormModal({ token, source, onClose, onSuccess }: SourceFormModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const isEdit = !!source;
  const [form, setForm] = useState<SourceFormData>(source ? sourceToForm(source) : EMPTY_SOURCE_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      if (isEdit && source) {
        await api.patch(
          `/sources/${source.id}`,
          {
            name: form.name,
            description: form.description || null,
            sort_order: form.sort_order,
          },
          token,
        );
      } else {
        await api.post(
          "/sources",
          {
            code: form.code,
            name: form.name,
            description: form.description || null,
            sort_order: form.sort_order,
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
      title={isEdit ? t("sources.edit") : t("sources.new")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="source-form-modal" disabled={submitting}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      }
    >
      <SourceForm
        embedded
        formId="source-form-modal"
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEdit={isEdit}
      />
    </Modal>
  );
}
