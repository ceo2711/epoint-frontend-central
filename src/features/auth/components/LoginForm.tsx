"use client";

import { FormEvent, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ApiError } from "@/lib/api";
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
      setError(err instanceof ApiError ? err.message : t("common.loginError"));
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
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              eP
            </div>
            <span className="text-lg font-bold text-slate-900">ePoint Central</span>
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

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>

        <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-center text-xs font-medium text-slate-500">{t("login.demoAccount")}</p>
          <p className="mt-1 text-center font-mono text-xs text-slate-600">
            admin@epoint.com · Admin123!
          </p>
        </div>
      </div>
    </div>
  );
}
