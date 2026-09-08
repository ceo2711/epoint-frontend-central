"use client";

import { FormEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";

interface UploadManualContractModalProps {
  onSubmit: (file: File, subject: string) => Promise<void>;
  onClose: () => void;
}

export function UploadManualContractModal({ onSubmit, onClose }: UploadManualContractModalProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError(t("docusign.uploadManualFileRequired"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(file, subject.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={t("docusign.uploadManualTitle")}
      subtitle={t("docusign.uploadManualSubtitle")}
      onClose={handleClose}
      dismissible={!submitting}
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="upload-manual-contract-form" disabled={submitting}>
            {submitting ? t("docusign.uploadManualSubmitting") : t("docusign.uploadManualAction")}
          </Button>
        </div>
      }
    >
      <form id="upload-manual-contract-form" className="space-y-4" onSubmit={handleSubmit}>
        <Input
          id="manual-contract-subject"
          label={t("docusign.uploadManualSubject")}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("docusign.uploadManualSubjectPlaceholder")}
        />
        <div>
          <label htmlFor="manual-contract-file" className="input-label">
            {t("docusign.uploadManualFile")}
          </label>
          <input
            id="manual-contract-file"
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
            className="input-field"
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name ?? "");
              setError("");
            }}
          />
          <p className="mt-1 text-xs text-slate-500">
            {fileName ? fileName : t("docusign.uploadManualHint")}
          </p>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </Modal>
  );
}
