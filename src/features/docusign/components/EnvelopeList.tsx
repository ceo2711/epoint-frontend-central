"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import type { DocusignEnvelope } from "@/features/docusign/types";

interface EnvelopeListProps {
  envelopes: DocusignEnvelope[];
  onSync: (envelopeId: number) => Promise<void>;
  syncingId?: number | null;
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "badge-green";
  if (normalized === "declined" || normalized === "voided") return "badge-red";
  if (normalized === "sent" || normalized === "delivered") return "badge-blue";
  return "badge-amber";
}

export function EnvelopeList({ envelopes, onSync, syncingId }: EnvelopeListProps) {
  const { t } = useTranslation();

  if (envelopes.length === 0) {
    return (
      <div className="card-flat p-6 text-sm text-slate-500">{t("docusign.noEnvelopes")}</div>
    );
  }

  return (
    <div className="card-flat overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{t("docusign.historyTitle")}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("docusign.signerName")}</th>
              <th className="px-4 py-3 font-medium">{t("common.email")}</th>
              <th className="px-4 py-3 font-medium">{t("common.client")}</th>
              <th className="px-4 py-3 font-medium">{t("common.status")}</th>
              <th className="px-4 py-3 font-medium">{t("docusign.sentAt")}</th>
              <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {envelopes.map((envelope) => (
              <tr key={envelope.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{envelope.signer_name}</td>
                <td className="px-4 py-3 text-slate-600">{envelope.signer_email}</td>
                <td className="px-4 py-3 text-slate-600">{envelope.client_name ?? t("common.dash")}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${statusClass(envelope.status)}`}>{envelope.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(envelope.sent_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={syncingId === envelope.id}
                    onClick={() => void onSync(envelope.id)}
                  >
                    {syncingId === envelope.id ? t("docusign.syncing") : t("docusign.syncAction")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
