"use client";

import { FormEvent, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ApiError } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TwoFactorLoginFormProps {
  userName?: string;
  onSubmit: (code: string) => Promise<void>;
  onBack: () => void;
}

export function TwoFactorLoginForm({ userName, onSubmit, onBack }: TwoFactorLoginFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(code.trim());
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("twoFactor.verifyError")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-1 items-center justify-center p-6 lg:p-12">
      <div className="card-glass relative w-full max-w-md p-6 sm:p-8 lg:p-10">
        <div className="absolute right-6 top-6 lg:right-8 lg:top-8">
          <LanguageSwitcher />
        </div>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("twoFactor.verifyTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {userName
            ? t("twoFactor.verifySubtitleNamed", { name: userName })
            : t("twoFactor.verifySubtitle")}
        </p>

        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
          {t("login.twoFactorStepHint")}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <div className="alert alert-error">{error}</div>}

          <Input
            id="code"
            name="code"
            label={t("login.twoFactorCodeLabel")}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
          />

          <Button type="submit" fullWidth size="lg" disabled={submitting || code.length !== 6}>
            {submitting ? t("twoFactor.verifying") : t("login.twoFactorSubmit")}
          </Button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          {t("login.twoFactorBack")}
        </button>
      </div>
    </div>
  );
}
