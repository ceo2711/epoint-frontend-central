"use client";

import { useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineDocumentArrowDown,
  HiOutlineDocumentCheck,
  HiOutlineUserPlus,
} from "react-icons/hi2";

import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { DocusignEnvelope } from "@/features/docusign/types";
import { canDownloadSentDocument, canDownloadSignedDocument } from "@/features/docusign/utils";

interface EnvelopeListProps {
  envelopes: DocusignEnvelope[];
  onSync: (envelopeId: number) => Promise<void>;
  onDownloadSigned: (envelopeId: number) => Promise<void>;
  onDownloadSent: (envelopeId: number) => Promise<void>;
  onRegisterClient?: (envelope: DocusignEnvelope) => void;
  syncingId?: number | null;
  showClientColumn?: boolean;
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

export function EnvelopeList({
  envelopes,
  onSync,
  onDownloadSigned,
  onDownloadSent,
  onRegisterClient,
  syncingId,
  showClientColumn = true,
}: EnvelopeListProps) {
  const { t } = useTranslation();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingSentId, setDownloadingSentId] = useState<number | null>(null);

  if (envelopes.length === 0) {
    return (
      <div className="card-flat p-6 text-sm text-slate-500">{t("docusign.noEnvelopes")}</div>
    );
  }

  async function handleDownloadSigned(envelopeId: number) {
    setDownloadingId(envelopeId);
    try {
      await onDownloadSigned(envelopeId);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadSent(envelopeId: number) {
    setDownloadingSentId(envelopeId);
    try {
      await onDownloadSent(envelopeId);
    } finally {
      setDownloadingSentId(null);
    }
  }

  return (
    <div className="card-flat overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{t("docusign.historyTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("docusign.historySubtitle")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("docusign.signerName")}</th>
              <th className="px-4 py-3 font-medium">{t("common.email")}</th>
              {showClientColumn ? (
                <th className="px-4 py-3 font-medium">{t("common.client")}</th>
              ) : null}
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
                  <td className="px-4 py-3 font-medium text-slate-900">{envelope.signer_name}</td>
                  <td className="px-4 py-3 text-slate-600">{envelope.signer_email}</td>
                  {showClientColumn ? (
                    <td className="px-4 py-3 text-slate-600">
                      {envelope.client_registered && envelope.client_name
                        ? envelope.client_name
                        : envelope.client_name ?? t("common.dash")}
                      {envelope.client_registered ? (
                        <span className="ml-2 badge badge-green">{t("docusign.clientRegisteredBadge")}</span>
                      ) : null}
                    </td>
                  ) : null}
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
                      {envelope.can_register_client && onRegisterClient ? (
                        <IconActionButton
                          label={t("docusign.registerClientAction")}
                          icon={<HiOutlineUserPlus />}
                          variant="primary"
                          onClick={() => onRegisterClient(envelope)}
                        />
                      ) : null}
                      <IconActionButton
                        label={
                          syncingId === envelope.id ? t("docusign.syncing") : t("docusign.syncAction")
                        }
                        icon={<HiOutlineArrowPath className={syncingId === envelope.id ? "animate-spin" : ""} />}
                        variant="ghost"
                        disabled={syncingId === envelope.id}
                        onClick={() => void onSync(envelope.id)}
                      />
                    </TableActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
