"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import { DOCUSIGN_REFRESH_EVENT } from "@/features/docusign/docusign-events";
import type { DocusignEnvelope } from "@/features/docusign/types";
import { canDownloadSentDocument, canDownloadSignedDocument, hasPendingEnvelopes } from "@/features/docusign/utils";
import { ApiError, api } from "@/lib/api";

const POLL_MS = 30_000;

interface ClientContractsPanelProps {
  clientId: number;
  token: string | null;
  onError?: (message: string) => void;
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "badge-green";
  if (normalized === "declined" || normalized === "voided") return "badge-red";
  if (normalized === "sent" || normalized === "delivered") return "badge-blue";
  return "badge-amber";
}

function statusKey(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "docusign.statusCompleted";
  if (normalized === "declined") return "docusign.statusDeclined";
  if (normalized === "voided") return "docusign.statusVoided";
  if (normalized === "delivered") return "docusign.statusDelivered";
  if (normalized === "sent") return "docusign.statusSent";
  return "docusign.statusUnknown";
}

export function ClientContractsPanel({ clientId, token, onError }: ClientContractsPanelProps) {
  const { t } = useTranslation();
  const [envelopes, setEnvelopes] = useState<DocusignEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingSentId, setDownloadingSentId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<DocusignEnvelope[]>(
        `/docusign/clients/${clientId}/envelopes`,
        token,
      );
      setEnvelopes(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("docusign.clientContractsError"));
      setEnvelopes([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, token, t]);

  const syncAll = useCallback(async () => {
    if (!token) return;
    setSyncingAll(true);
    try {
      await api.post<DocusignEnvelope[]>("/docusign/envelopes/sync-pending", {}, token);
      await load();
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : t("docusign.syncError"));
    } finally {
      setSyncingAll(false);
    }
  }, [token, load, onError, t]);

  useEffect(() => {
    void syncAll();
  }, [syncAll]);

  useEffect(() => {
    if (!token || !hasPendingEnvelopes(envelopes)) return;

    const interval = window.setInterval(() => {
      void syncAll();
    }, POLL_MS);

    return () => window.clearInterval(interval);
  }, [token, envelopes, syncAll]);

  useEffect(() => {
    if (!token) return;

    const onRefresh = () => {
      void syncAll();
    };

    window.addEventListener(DOCUSIGN_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(DOCUSIGN_REFRESH_EVENT, onRefresh);
  }, [token, syncAll]);

  async function openBlob(path: string) {
    if (!token) return;
    const blob = await api.getBlob(path, token);
    const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function handleDownloadSigned(envelopeId: number) {
    setDownloadingId(envelopeId);
    try {
      await openBlob(`/docusign/envelopes/${envelopeId}/document`);
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : t("docusign.downloadError"));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadSent(envelopeId: number) {
    setDownloadingSentId(envelopeId);
    try {
      await openBlob(`/docusign/envelopes/${envelopeId}/document/sent`);
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : t("docusign.downloadSentError"));
    } finally {
      setDownloadingSentId(null);
    }
  }

  async function handleSync(envelopeId: number) {
    if (!token) return;
    setSyncingId(envelopeId);
    try {
      const updated = await api.post<DocusignEnvelope>(
        `/docusign/envelopes/${envelopeId}/sync`,
        {},
        token,
      );
      setEnvelopes((prev) => prev.map((item) => (item.id === envelopeId ? updated : item)));
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : t("docusign.syncError"));
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{t("docusign.clientContractsSubtitle")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="ghost" disabled={syncingAll} onClick={() => void syncAll()}>
            {syncingAll ? t("docusign.syncing") : t("docusign.syncAction")}
          </Button>
          <Link href="/contratos" className="text-sm font-medium text-blue-700 hover:underline">
            {t("docusign.goToContracts")}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : envelopes.length === 0 ? (
        <p className="text-sm text-slate-500">{t("docusign.clientContractsEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t("docusign.subject")}</th>
                <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                <th className="px-4 py-3 font-medium">{t("docusign.sentAt")}</th>
                <th className="px-4 py-3 font-medium">{t("docusign.completedAt")}</th>
                <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {envelopes.map((envelope) => {
                const showSigned = canDownloadSignedDocument(envelope);
                const showSent = canDownloadSentDocument(envelope) && !showSigned;
                return (
                  <tr key={envelope.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{envelope.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusClass(envelope.status)}`}>
                        {t(statusKey(envelope.status))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(envelope.sent_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {envelope.completed_at
                        ? new Date(envelope.completed_at).toLocaleString()
                        : t("common.dash")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {showSent ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={downloadingSentId === envelope.id}
                            onClick={() => void handleDownloadSent(envelope.id)}
                          >
                            {downloadingSentId === envelope.id
                              ? t("docusign.downloading")
                              : t("docusign.viewSent")}
                          </Button>
                        ) : null}
                        {showSigned ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={downloadingId === envelope.id}
                            onClick={() => void handleDownloadSigned(envelope.id)}
                          >
                            {downloadingId === envelope.id
                              ? t("docusign.downloading")
                              : t("docusign.viewSigned")}
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={syncingId === envelope.id}
                          onClick={() => void handleSync(envelope.id)}
                        >
                          {syncingId === envelope.id ? t("docusign.syncing") : t("docusign.syncAction")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
