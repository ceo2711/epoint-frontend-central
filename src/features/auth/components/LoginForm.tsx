"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AppLogo } from "@/components/layout/AppLogo";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { EmailIcon, Input, PasswordInput } from "@/components/ui/Input";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  /** Solo la tarjeta, sin el wrapper de centrado de página. */
  embedded?: boolean;
  /** Clase para desvanecer textos/campos al animar. */
  contentClassName?: string;
  className?: string;
}

export function LoginForm({
  onSubmit,
  embedded = false,
  contentClassName = "",
  className = "",
}: LoginFormProps) {
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

  const card = (
    <div
      className={`card-glass relative z-10 w-full min-w-0 max-w-md overflow-hidden p-6 sm:p-8 lg:p-10 ${className}`.trim()}
    >
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
        <LanguageSwitcher compact />
        <ThemeToggle size="sm" />
      </div>

      <div className={`transition-opacity duration-500 ease-out ${contentClassName}`.trim()}>
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

        <div className="mb-8 lg:pr-24">
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

  if (embedded) return card;

  return (
    <div className="relative z-10 flex min-w-0 flex-1 items-center justify-center overflow-x-hidden p-4 sm:p-6 lg:p-12">
      {card}
    </div>
  );
}
