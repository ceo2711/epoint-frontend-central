"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { SendContractForm } from "@/features/docusign/components/SendContractForm";
import type { Client } from "@/features/clients/types";
import type {
  DocusignSendPayload,
  DocusignTemplate,
  DocusignTemplateDetail,
} from "@/features/docusign/types";

interface SendContractModalProps {
  signerName: string;
  signerEmail: string;
  clientId?: number;
  prospectId?: number;
  templates: DocusignTemplate[];
  defaultTemplateId?: string | null;
  defaultRoleName?: string | null;
  onSearchClients: (query: string) => Promise<Client[]>;
  onLoadTemplateDetail?: (templateId: string) => Promise<DocusignTemplateDetail | null>;
  onSubmit: (payload: DocusignSendPayload) => Promise<void>;
  onClose: () => void;
}

export function SendContractModal({
  signerName,
  signerEmail,
  clientId,
  prospectId,
  templates,
  defaultTemplateId,
  defaultRoleName,
  onSearchClients,
  onLoadTemplateDetail,
  onSubmit,
  onClose,
}: SendContractModalProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(payload: DocusignSendPayload) {
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={t("docusign.sendTitle")}
      subtitle={t("docusign.sendFromMeetingSubtitle", {
        signer: signerName,
        email: signerEmail,
      })}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="send-contract-form"
            disabled={submitting || templates.length === 0}
          >
            {submitting ? t("docusign.sending") : t("docusign.sendAction")}
          </Button>
        </div>
      }
    >
      <SendContractForm
        embedded
        hideClientSearch
        templates={templates}
        defaultTemplateId={defaultTemplateId}
        defaultRoleName={defaultRoleName}
        initialSigner={{ name: signerName, email: signerEmail, clientId, prospectId }}
        onSearchClients={onSearchClients}
        onLoadTemplateDetail={onLoadTemplateDetail}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
