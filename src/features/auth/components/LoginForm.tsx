"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { AppLogo } from "@/components/layout/AppLogo";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { EmailIcon, Input, PasswordInput } from "@/components/ui/Input";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(email.trim(), password.trim());
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("common.loginError")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-12">
      <div className="card-glass relative z-10 w-full max-w-md p-6 sm:p-8 lg:p-10">
        <div className="absolute right-6 top-6 lg:right-8 lg:top-8">
          <LanguageSwitcher />
        </div>

        <div className="mb-8 lg:hidden">
          <div className="mb-4 flex items-center gap-4">
            <AppLogo size="xl" priority className="rounded-2xl" />
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">ePoint Central</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t("login.welcome")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="alert alert-error">{error}</div>}

          <Input
            id="email"
            name="email"
            label={t("login.emailLabel")}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            icon={<EmailIcon />}
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder={t("login.emailPlaceholder")}
          />

          <PasswordInput
            id="password"
            name="password"
            label={t("login.passwordLabel")}
            autoComplete="current-password"
            required
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.passwordPlaceholder")}
            showLabel={t("login.showPassword")}
            hideLabel={t("login.hidePassword")}
          />

          <div className="flex flex-col items-center gap-0.5 text-center">
            <Link
              href="/recuperar-contrasena"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {t("login.forgotPassword")}
            </Link>
            <span className="text-xs text-slate-400">{t("login.forgotPasswordHint")}</span>
          </div>

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
