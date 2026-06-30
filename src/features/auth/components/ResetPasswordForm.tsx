"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ApiError, api } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Input";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("resetPassword.minLength"));
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("resetPassword.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="login-bg flex min-h-screen items-center justify-center px-4 py-12">
        <div className="card-glass w-full max-w-md p-6 sm:p-8">
          <div className="alert alert-error">{t("resetPassword.invalidLink")}</div>
          <p className="mt-4 text-center text-sm">
            <Link href="/recuperar-contrasena" className="font-medium text-blue-600 hover:text-blue-700">
              {t("resetPassword.requestNewLink")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card-glass relative w-full max-w-md p-6 sm:p-8 lg:p-10">
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("resetPassword.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{t("resetPassword.subtitle")}</p>

        {success ? (
          <div className="mt-8 space-y-4">
            <div className="alert alert-success">{t("resetPassword.success")}</div>
            <Button fullWidth onClick={() => (window.location.href = "/login")}>
              {t("resetPassword.goToLogin")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <div className="alert alert-error">{error}</div>}

            <PasswordInput
              label={t("resetPassword.newPassword")}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
            <PasswordInput
              label={t("resetPassword.confirmPassword")}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? t("resetPassword.submitting") : t("resetPassword.submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
