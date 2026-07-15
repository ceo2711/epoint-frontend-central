"use client";

import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useDocusign } from "@/features/docusign/hooks/useDocusign";
import { ProspectContractsModal } from "@/features/prospects/components/ProspectContractsModal";
import { ProspectHistoryTimeline } from "@/features/prospects/components/ProspectHistoryTimeline";
import { ProspectLinkedResources } from "@/features/prospects/components/ProspectLinkedResources";
import type { ProspectPipelineSummary, ProspectStatus } from "@/features/prospects/types";

interface ClientSalesPipelineSectionProps {
  pipeline: ProspectPipelineSummary;
  locale: string;
}

export function ClientSalesPipelineSection({ pipeline, locale }: ClientSalesPipelineSectionProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [contractsOpen, setContractsOpen] = useState(false);
  const { downloadSignedDocument, downloadSentDocument } = useDocusign(token, {
    listenRefresh: false,
    autoSync: false,
    loadEnvelopes: false,
  });

  async function handleViewSigned(envelopeId: number) {
    const blob = await downloadSignedDocument(envelopeId);
    if (!blob) return;
    const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function handleViewSent(envelopeId: number) {
    const blob = await downloadSentDocument(envelopeId);
    if (!blob) return;
    const url = URL.createObjectURL(new Blob([blob.data], { type: blob.mimeType }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <section className="space-y-4">
      <ProspectLinkedResources
        locale={locale}
        prospectStatus={pipeline.status as ProspectStatus}
        calendly={pipeline.calendly_event}
        envelopes={pipeline.docusign_envelopes}
        payment={pipeline.payment_link}
        canManage={false}
        clientView
        onViewContracts={
          pipeline.docusign_envelopes.length > 0 ? () => setContractsOpen(true) : undefined
        }
      />

      {pipeline.history.length > 0 ? (
        <Card className="p-4 sm:p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
            {t("prospects.history.title")}
          </h3>
          <ProspectHistoryTimeline history={pipeline.history} locale={locale} />
        </Card>
      ) : null}

      {contractsOpen ? (
        <ProspectContractsModal
          envelopes={pipeline.docusign_envelopes}
          locale={locale}
          onClose={() => setContractsOpen(false)}
          onViewSigned={(id) => void handleViewSigned(id)}
          onViewSent={(id) => void handleViewSent(id)}
        />
      ) : null}
    </section>
  );
}
