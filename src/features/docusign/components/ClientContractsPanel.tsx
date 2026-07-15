"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineDocumentArrowDown,
  HiOutlineDocumentCheck,
} from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SendContractModal } from "@/features/docusign/components/SendContractModal";
import { DOCUSIGN_REFRESH_EVENT } from "@/features/docusign/docusign-events";
import { useDocusign } from "@/features/docusign/hooks/useDocusign";
import type { DocusignEnvelope } from "@/features/docusign/types";
import { canDownloadSentDocument, canDownloadSignedDocument, hasPendingEnvelopes } from "@/features/docusign/utils";
import { ApiError, api } from "@/lib/api";

const POLL_MS = 15_000;
const MIN_SYNC_GAP_MS = 5_000;

interface ClientContractsPanelProps {
  clientId: number;
  clientName: string;
  clientEmail: string;
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

export function ClientContractsPanel({
  clientId,
  clientName,
  clientEmail,
  token,
  onError,
}: ClientContractsPanelProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const [envelopes, setEnvelopes] = useState<DocusignEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingSentId, setDownloadingSentId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const syncInFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);

  const {
    connection,
    templates,
    sendEnvelope,
    loadTemplateDetail,
    searchClients,
  } = useDocusign(token, { loadEnvelopes: false, listenRefresh: false });

  const canSendContract = !!connection?.connected && templates.length > 0;

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
      setError(getUserFacingErrorMessage(err, t("docusign.clientContractsError")));
      setEnvelopes([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, token, t]);

  const syncAll = useCallback(async (options?: { force?: boolean }) => {
    if (!token) return;
    const now = Date.now();
    if (
      !options?.force &&
      (syncInFlightRef.current || now - lastSyncAtRef.current < MIN_SYNC_GAP_MS)
    ) {
      return;
    }

    syncInFlightRef.current = true;
    setSyncingAll(true);
    try {
      await api.post<DocusignEnvelope[]>("/docusign/envelopes/sync-pending", {}, token);
      lastSyncAtRef.current = Date.now();
      await load();
    } catch (err) {
      onError?.(getUserFacingErrorMessage(err, t("docusign.syncError")));
    } finally {
      syncInFlightRef.current = false;
      setSyncingAll(false);
    }
  }, [token, load, onError, t]);

  const shouldPoll = useMemo(() => hasPendingEnvelopes(envelopes), [envelopes]);

  useEffect(() => {
    lastSyncAtRef.current = 0;
    void syncAll();
  }, [clientId, token]);

  useEffect(() => {
    if (!token || !shouldPoll) return;

    const interval = window.setInterval(() => {
      void syncAll();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncAll({ force: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, shouldPoll, syncAll]);

  useEffect(() => {
    if (!token) return;

    const onRefresh = () => {
      void syncAll({ force: true });
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
      onError?.(getUserFacingErrorMessage(err, t("docusign.downloadError")));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadSent(envelopeId: number) {
    setDownloadingSentId(envelopeId);
    try {
      await openBlob(`/docusign/envelopes/${envelopeId}/document/sent`);
    } catch (err) {
      onError?.(getUserFacingErrorMessage(err, t("docusign.downloadSentError")));
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
      onError?.(getUserFacingErrorMessage(err, t("docusign.syncError")));
    } finally {
      setSyncingId(null);
    }
  }

  async function handleSendContract(payload: Parameters<typeof sendEnvelope>[0]) {
    try {
      const result = await sendEnvelope({
        ...payload,
        client_id: clientId,
        signer_name: clientName.trim(),
        signer_email: clientEmail.trim(),
      });
      setSendOpen(false);
      await load();
      await modal.alert({
        title: t("docusign.sendSuccessTitle"),
        message: result?.message ?? t("docusign.sendSuccessMessage"),
        variant: "success",
      });
    } catch (err) {
      onError?.(getUserFacingErrorMessage(err, t("docusign.sendError")));
      throw err;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{t("docusign.clientContractsSubtitle")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={!canSendContract}
            onClick={() => setSendOpen(true)}
          >
            {t("docusign.sendAction")}
          </Button>
          <Button size="sm" variant="ghost" disabled={syncingAll} onClick={() => void syncAll()}>
            {syncingAll ? t("docusign.syncing") : t("docusign.syncAction")}
          </Button>
        </div>
      </div>

      {!connection?.connected ? (
        <p className="text-sm text-slate-500">{t("docusign.notConfigured")}</p>
      ) : null}

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
                      <TableActions>
                        {showSent ? (
                          <IconActionButton
                            label={
                              downloadingSentId === envelope.id
                                ? t("docusign.downloading")
                                : t("docusign.viewSent")
                            }
                            icon={<HiOutlineDocumentArrowDown />}
                            disabled={downloadingSentId === envelope.id}
                            onClick={() => void handleDownloadSent(envelope.id)}
                          />
                        ) : null}
                        {showSigned ? (
                          <IconActionButton
                            label={
                              downloadingId === envelope.id
                                ? t("docusign.downloading")
                                : t("docusign.viewSigned")
                            }
                            icon={<HiOutlineDocumentCheck />}
                            disabled={downloadingId === envelope.id}
                            onClick={() => void handleDownloadSigned(envelope.id)}
                          />
                        ) : null}
                        <IconActionButton
                          label={
                            syncingId === envelope.id ? t("docusign.syncing") : t("docusign.syncAction")
                          }
                          icon={<HiOutlineArrowPath className={syncingId === envelope.id ? "animate-spin" : ""} />}
                          variant="ghost"
                          disabled={syncingId === envelope.id}
                          onClick={() => void handleSync(envelope.id)}
                        />
                      </TableActions>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sendOpen ? (
        <SendContractModal
          signerName={clientName}
          signerEmail={clientEmail}
          clientId={clientId}
          templates={templates}
          defaultTemplateId={connection?.default_template_id}
          defaultRoleName={connection?.default_template_role_name}
          onSearchClients={searchClients}
          onLoadTemplateDetail={loadTemplateDetail}
          onSubmit={handleSendContract}
          onClose={() => setSendOpen(false)}
        />
      ) : null}
    </div>
  );
}
