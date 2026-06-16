"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";
import { loadPortalCredentials, savePortalCredentials } from "@/features/clients/portal-credentials-storage";
import type { Client, ClientPortalPassword } from "@/types/api";

interface PortalCredentialsCardProps {
  client: Client;
  tempPassword: string | null;
  token: string | null;
  canReset: boolean;
  onPasswordUpdated: (password: string) => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
      {copied ? t("modal.copied") : label}
    </Button>
  );
}

export function PortalCredentialsCard({
  client,
  tempPassword,
  token,
  canReset,
  onPasswordUpdated,
}: PortalCredentialsCardProps) {
  const { t } = useTranslation();
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!client.has_portal_access) return null;

  const portalEmail = client.portal_email ?? client.email;

  async function handleReset() {
    if (!token) return;
    setResetting(true);
    setError(null);
    try {
      const res = await api.post<ClientPortalPassword>(
        `/clients/${client.id}/reset-portal-password`,
        {},
        token,
      );
      savePortalCredentials(client.id, {
        email: res.email,
        tempPassword: res.temp_password,
        portalLoginUrl: res.portal_login_url,
      });
      onPasswordUpdated(res.temp_password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
            {t("clientDetail.portalAccess")}
          </h2>
          <p className="mt-1 text-sm text-emerald-900/80">{t("clientDetail.portalAccessHint")}</p>
        </div>
        {canReset && (
          <Button type="button" size="sm" variant="secondary" disabled={resetting} onClick={handleReset}>
            {resetting ? t("clientDetail.regeneratingPassword") : t("clientDetail.regeneratePassword")}
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-100 bg-white/80 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.portalUser")}</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-900">{portalEmail}</p>
          <div className="mt-2">
            <CopyButton value={portalEmail} label={t("clientDetail.copyUser")} />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-white/80 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.portalPassword")}</p>
          {tempPassword ? (
            <>
              <p className="mt-1 break-all font-mono text-sm text-slate-900">
                {showPassword ? tempPassword : "••••••••••••"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? t("clientDetail.hidePassword") : t("clientDetail.showPassword")}
                </Button>
                <CopyButton value={tempPassword} label={t("clientDetail.copyPassword")} />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500">{t("clientDetail.passwordUnavailable")}</p>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
