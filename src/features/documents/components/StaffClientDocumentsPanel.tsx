"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useState } from "react";

import { DocumentRequirementsPanel } from "@/features/documents/components/DocumentRequirementsPanel";
import { useTranslation } from "@/contexts/LanguageContext";
import { type Locale } from "@/i18n";
import { ApiError, api } from "@/lib/api";
import { formatDateTime } from "@/lib/format-datetime";
import type { DocumentBrief } from "@/types/api";

interface StaffClientDocumentsPanelProps {
  clientId: number;
  documents: DocumentBrief[] | undefined;
  token: string | null;
  locale: Locale;
  canUpload?: boolean;
  onUploaded: () => void;
  onViewDocument: (doc: DocumentBrief) => void;
  onDownloadDocument?: (doc: DocumentBrief) => void;
}


export function StaffClientDocumentsPanel({
  clientId,
  documents,
  token,
  locale,
  canUpload = true,
  onUploaded,
  onViewDocument,
  onDownloadDocument,
}: StaffClientDocumentsPanelProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const isVerifying = documents?.some(
    (d) => d.verification_status === "PENDIENTE" || d.verification_status === "EN_PROCESO",
  );

  useEffect(() => {
    if (!token || !isVerifying) return;
    const interval = window.setInterval(() => onUploaded(), 5000);
    return () => window.clearInterval(interval);
  }, [token, isVerifying, onUploaded]);

  async function handleUpload(docType: string, file: File) {
    if (!token) return;
    setUploading(docType);
    setMessage("");
    setIsError(false);
    try {
      const formData = new FormData();
      formData.append("document_type", docType);
      formData.append("file", file);

      await api.upload<DocumentBrief>(
        `/documents/upload?client_id=${clientId}`,
        formData,
        token,
      );

      setMessage(t("clientDetail.uploadSuccess"));
      onUploaded();
    } catch (err) {
      setMessage(getUserFacingErrorMessage(err, t("clientDetail.uploadError")));
      setIsError(true);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <p className="text-sm leading-relaxed text-slate-600">
        {t(canUpload ? "clientDetail.documentsUploadHint" : "clientDetail.documentsViewHint")}
      </p>

      {message && (
        <div className={`alert ${isError ? "alert-error" : "alert-success"}`}>{message}</div>
      )}

      <DocumentRequirementsPanel
        documents={documents}
        locale={locale}
        uploading={uploading}
        t={t}
        onUpload={handleUpload}
        variant="staff"
        canUpload={canUpload}
        onViewDocument={onViewDocument}
        onDownloadDocument={onDownloadDocument}
        formatDate={formatDateTime}
      />
    </div>
  );
}
