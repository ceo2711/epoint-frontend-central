"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalCloseButton } from "@/components/ui/Modal";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useTranslation } from "@/contexts/LanguageContext";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface SensitiveDocumentUnlockModalProps {
  needsSetup: boolean;
  onSubmit: (code: string) => Promise<void>;
  onClose: () => void;
  onGoToSettings: () => void;
  variant?: "document" | "ssn";
}

export function SensitiveDocumentUnlockModal({
  needsSetup,
  onSubmit,
  onClose,
  onGoToSettings,
  variant = "document",
}: SensitiveDocumentUnlockModalProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSsn = variant === "ssn";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(code.trim());
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("sensitiveDocs.verifyError")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalPortal>
      <div className="modal-overlay fixed inset-0 z-70 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="modal-panel w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isSsn ? t("sensitiveDocs.ssnTitle") : t("sensitiveDocs.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {needsSetup
                  ? isSsn
                    ? t("sensitiveDocs.ssnSetupHint")
                    : t("sensitiveDocs.setupHint")
                  : isSsn
                    ? t("sensitiveDocs.ssnSubtitle")
                    : t("sensitiveDocs.subtitle")}
              </p>
            </div>
            <ModalCloseButton onClick={onClose} />
          </div>

          {needsSetup ? (
            <div className="space-y-4">
              <Button type="button" onClick={onGoToSettings} className="w-full">
                {t("sensitiveDocs.goToSettings")}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="w-full">
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t("twoFactor.codeLabel")}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" disabled={submitting || code.length !== 6} className="w-full">
                {submitting ? t("twoFactor.verifying") : t("sensitiveDocs.verifySubmit")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
