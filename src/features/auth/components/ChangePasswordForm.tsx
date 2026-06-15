"use client";

import { FormEvent, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ApiError } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Input";

interface ChangePasswordFormProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function ChangePasswordForm({ onSubmit }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("changePassword.mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("changePassword.minLength"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("changePassword.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card-glass relative w-full max-w-md p-6 sm:p-8 lg:p-10">
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("changePassword.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{t("changePassword.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <div className="alert alert-error">{error}</div>}

          <PasswordInput
            label={t("changePassword.currentPassword")}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            showLabel={t("login.showPassword")}
            hideLabel={t("login.hidePassword")}
          />
          <PasswordInput
            label={t("changePassword.newPassword")}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            showLabel={t("login.showPassword")}
            hideLabel={t("login.hidePassword")}
          />
          <PasswordInput
            label={t("changePassword.confirmPassword")}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showLabel={t("login.showPassword")}
            hideLabel={t("login.hidePassword")}
          />

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? t("changePassword.saving") : t("changePassword.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}
