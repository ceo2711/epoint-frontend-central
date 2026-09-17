"use client";

import { useCallback, useState } from "react";
import {
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

const SSN_MASK = "***-**-****";

interface ClientSsnFieldProps {
  clientId: number;
  hasSsn: boolean;
  token: string | null;
}

export function ClientSsnField({ clientId, hasSsn, token }: ClientSsnFieldProps) {
  const { t } = useTranslation();
  const [ssn, setSsn] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSsn = useCallback(async (): Promise<string | null> => {
    if (ssn) return ssn;
    if (!token) return null;
    setBusy(true);
    setError(null);
    try {
      const data = await api.get<{ ssn: string }>(`/clients/${clientId}/ssn`, token);
      setSsn(data.ssn);
      return data.ssn;
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("clientDetail.ssnLoadError")));
      return null;
    } finally {
      setBusy(false);
    }
  }, [clientId, ssn, t, token]);

  async function handleToggleVisibility() {
    if (visible) {
      setVisible(false);
      return;
    }
    const value = await loadSsn();
    if (value) setVisible(true);
  }

  async function handleCopy() {
    const value = await loadSsn();
    if (!value) return;
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!hasSsn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="section-label">{t("clientDetail.hasSsn")}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{t("common.no")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="section-label">{t("clientDetail.hasSsn")}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="min-w-0 font-mono text-sm font-semibold tracking-wide text-slate-900">
          {busy ? t("common.loading") : visible && ssn ? ssn : SSN_MASK}
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconActionButton
            label={visible ? t("clientDetail.hideSsn") : t("clientDetail.showSsn")}
            icon={visible ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
            variant="ghost"
            disabled={busy}
            onClick={() => {
              void handleToggleVisibility();
            }}
          />
          <IconActionButton
            label={copied ? t("common.copied") : t("clientDetail.copySsn")}
            icon={copied ? <HiOutlineClipboardDocumentCheck /> : <HiOutlineClipboard />}
            variant="ghost"
            disabled={busy}
            onClick={() => {
              void handleCopy();
            }}
          />
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
