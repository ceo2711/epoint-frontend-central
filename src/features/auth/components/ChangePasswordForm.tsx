"use client";

import { FormEvent, useState } from "react";

import { AppLogo } from "@/components/layout/AppLogo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import { DesertBackground } from "@/features/auth/components/DesertBackground";
import { LoginHero } from "@/features/auth/components/LoginHero";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

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
      setError(getUserFacingErrorMessage(err, t("changePassword.error")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-bg relative flex min-h-dvh h-dvh min-w-0 overflow-x-hidden">
      <DesertBackground />

      <LoginHero brandOnly brandClassName="opacity-100" />

      <div className="relative z-10 flex min-w-0 flex-1 items-center justify-center overflow-x-hidden p-4 sm:p-6 lg:p-12">
        <div className="card-glass relative z-10 w-full min-w-0 max-w-md overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
            <LanguageSwitcher compact />
            <ThemeToggle size="sm" />
          </div>

          <div className="mb-8 pr-24 lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <AppLogo size="xl" priority className="shrink-0 rounded-2xl" />
              <p className="min-w-0 text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                Epoint
                <br />
                Corporation
              </p>
            </div>
          </div>

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:pr-24">
            {t("changePassword.title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {t("changePassword.subtitle")}
          </p>

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

            <Button type="submit" fullWidth size="lg" disabled={submitting}>
              {submitting ? t("changePassword.saving") : t("changePassword.save")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
