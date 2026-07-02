"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import type { DocusignEnvelope } from "@/features/docusign/types";
import { ApiError, api } from "@/lib/api";

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

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDownload(envelopeId: number) {
    if (!token) return;
    setDownloadingId(envelopeId);
    try {
      const blob = await api.getBlob(`/docusign/envelopes/${envelopeId}/document`, token);
      const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : t("docusign.downloadError"));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{t("docusign.clientContractsSubtitle")}</p>
        <Link href="/contratos" className="text-sm font-medium text-blue-700 hover:underline">
          {t("docusign.goToContracts")}
        </Link>
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
                const isCompleted = envelope.status.toLowerCase() === "completed";
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
                      {isCompleted ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={downloadingId === envelope.id}
                          onClick={() => void handleDownload(envelope.id)}
                        >
                          {downloadingId === envelope.id
                            ? t("docusign.downloading")
                            : t("docusign.viewSigned")}
                        </Button>
                      ) : (
                        <span className="text-slate-400">{t("common.dash")}</span>
                      )}
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
