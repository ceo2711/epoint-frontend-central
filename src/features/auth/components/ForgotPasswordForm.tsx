"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ApiError, api } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { EmailIcon, Input } from "@/components/ui/Input";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const result = await api.post<{ message: string }>("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("forgotPassword.error"));
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

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("forgotPassword.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{t("forgotPassword.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <Input
            id="email"
            name="email"
            label={t("login.emailLabel")}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            icon={<EmailIcon />}
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder={t("login.emailPlaceholder")}
          />

          <Button type="submit" fullWidth disabled={submitting || Boolean(success)}>
            {submitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
