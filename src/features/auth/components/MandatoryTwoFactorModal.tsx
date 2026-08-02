"use client";

import { FormEvent, useState } from "react";
import QRCode from "react-qr-code";
import { HiOutlineShieldCheck } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import type { TotpSetupResponse } from "@/types/api";

/**
 * Modal bloqueante que obliga a configurar 2FA. Se muestra a todo usuario
 * logueado sin doble factor activo y no se puede cerrar hasta completarlo.
 */
export function MandatoryTwoFactorModal() {
  const { user, token, refreshUser, logout } = useAuth();
  const { t } = useTranslation();

  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Primero cambio de contraseña obligatorio; el 2FA viene después.
  if (!user || !token || user.totp_enabled || user.must_change_password) return null;

  async function handleStart() {
    setError("");
    setBusy(true);
    try {
      const data = await api.post<TotpSetupResponse>("/auth/2fa/setup", {}, token);
      setSetupData(data);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("account.twoFactor.error")));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/2fa/confirm", { code: confirmCode }, token);
      await refreshUser();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("account.twoFactor.error")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={t("twoFactorRequired.title")}
      subtitle={t("twoFactorRequired.subtitle")}
      dismissible={false}
      size="lg"
    >
      <div className="space-y-5">
        {error ? <div className="alert alert-error">{error}</div> : null}

        {!setupData ? (
          <>
            <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <HiOutlineShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">{t("twoFactorRequired.explanation")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="secondary" onClick={logout}>
                {t("common.logout")}
              </Button>
              <Button type="button" onClick={() => void handleStart()} disabled={busy}>
                {busy ? t("account.twoFactor.settingUp") : t("twoFactorRequired.start")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">{t("account.twoFactor.scanHint")}</p>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-start">
              <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
                <QRCode value={setupData.provisioning_uri} size={160} />
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p className="font-medium text-slate-900">{t("account.twoFactor.manualEntry")}</p>
                <code className="block break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                  {setupData.secret}
                </code>
              </div>
            </div>
            <form onSubmit={handleConfirm} className="space-y-4">
              <Input
                id="mandatory-2fa-code"
                label={t("account.twoFactor.codeLabel")}
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="secondary" onClick={logout}>
                  {t("common.logout")}
                </Button>
                <Button type="submit" disabled={busy || confirmCode.length !== 6}>
                  {busy ? t("account.twoFactor.confirming") : t("account.twoFactor.confirm")}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
