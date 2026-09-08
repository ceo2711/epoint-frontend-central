"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";

interface EditRemainderDueModalProps {
  currentDate: string | null | undefined;
  submitting?: boolean;
  onClose: () => void;
  onSave: (isoDate: string) => Promise<void>;
}

export function EditRemainderDueModal({
  currentDate,
  submitting = false,
  onClose,
  onSave,
}: EditRemainderDueModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentDate ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value) {
      setError(t("payments.form.remainderDueRequired"));
      return;
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (value < todayIso) {
      setError(t("payments.form.remainderDuePastError"));
      return;
    }
    setError(null);
    await onSave(value);
  }

  return (
    <Modal
      title={t("payments.remainderDue.editTitle")}
      subtitle={t("payments.remainderDue.editSubtitle")}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <DateInput
          label={t("payments.form.remainderDueOn")}
          value={value}
          onChange={(isoDate) => {
            setError(null);
            setValue(isoDate);
          }}
          required
          disabled={submitting}
          error={error ?? undefined}
          hint={t("payments.form.remainderDueHint")}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.saving") : t("payments.remainderDue.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
