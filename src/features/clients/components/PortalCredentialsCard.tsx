"use client";

import { useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineClipboard,
  HiOutlineClipboardDocumentCheck,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

import { IconActionButton } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { savePortalCredentials } from "@/features/clients/portal-credentials-storage";
import type { Client, ClientPortalPassword } from "@/types/api";

interface PortalCredentialsCardProps {
  client: Client;
  tempPassword: string | null;
  token: string | null;
  canReset: boolean;
  onPasswordUpdated: (password: string) => void;
  className?: string;
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <IconActionButton
      label={copied ? t("modal.copied") : label}
      icon={copied ? <HiOutlineClipboardDocumentCheck /> : <HiOutlineClipboard />}
      variant="ghost"
      onClick={() => {
        void handleCopy();
      }}
    />
  );
}

export function PortalCredentialsCard({
  client,
  tempPassword,
  token,
  canReset,
  onPasswordUpdated,
  className = "",
}: PortalCredentialsCardProps) {
  const { t } = useTranslation();
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true);

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
      setShowPassword(true);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("common.error")));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm sm:p-5 ${className}`.trim()}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
            {t("clientDetail.portalAccess")}
          </h2>
          <p className="mt-1 text-sm text-emerald-900/80">{t("clientDetail.portalAccessHint")}</p>
        </div>
        {canReset ? (
          <IconActionButton
            label={
              resetting ? t("clientDetail.regeneratingPassword") : t("clientDetail.regeneratePassword")
            }
            icon={<HiOutlineArrowPath className={resetting ? "animate-spin" : undefined} />}
            variant="ghost"
            disabled={resetting}
            onClick={() => {
              void handleReset();
            }}
          />
        ) : null}
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
        <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="section-label">{t("clientDetail.portalUser")}</p>
              <p className="mt-1 break-all font-mono text-sm text-slate-900">{portalEmail}</p>
            </div>
            <CopyIconButton value={portalEmail} label={t("clientDetail.copyUser")} />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="section-label">{t("clientDetail.portalPassword")}</p>
              {tempPassword ? (
                <p className="mt-1 break-all font-mono text-sm text-slate-900">
                  {showPassword ? tempPassword : "••••••••••••"}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">{t("clientDetail.passwordUnavailableShort")}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {tempPassword ? (
                <>
                  <IconActionButton
                    label={
                      showPassword ? t("clientDetail.hidePassword") : t("clientDetail.showPassword")
                    }
                    icon={showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                    variant="ghost"
                    onClick={() => setShowPassword((v) => !v)}
                  />
                  <CopyIconButton value={tempPassword} label={t("clientDetail.copyPassword")} />
                </>
              ) : canReset ? (
                <IconActionButton
                  label={t("clientDetail.regeneratePassword")}
                  icon={<HiOutlineArrowPath className={resetting ? "animate-spin" : undefined} />}
                  variant="ghost"
                  disabled={resetting}
                  onClick={() => {
                    void handleReset();
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
