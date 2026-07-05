"use client";

import { useEffect, useState } from "react";

import { DocumentRequirementsPanel } from "@/features/documents/components/DocumentRequirementsPanel";
import { PortalPageLoader } from "@/features/portal/components/PortalPageLoader";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { usePortalDocuments, usePortalMe } from "@/features/portal/hooks/usePortalWorkspace";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT, shouldRefreshClient, type ClientsRefreshDetail } from "@/lib/clientEvents";
import { prefetchDocuments } from "@/lib/contentBlobCache";
import type { DocumentBrief } from "@/types/api";

export default function PortalDocumentosPage() {
  const { token, user } = useAuth();
  const { t, locale } = useTranslation();
  const profileQuery = usePortalMe(token);
  const documentsQuery = usePortalDocuments(token);
  const client =
    profileQuery.data && documentsQuery.data
      ? { ...profileQuery.data, documents: documentsQuery.data }
      : profileQuery.data ?? null;
  const loading = profileQuery.isLoading || documentsQuery.isLoading;
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function reload(options?: { silent?: boolean }) {
    if (!token) return;
    void profileQuery.refetch();
    void documentsQuery.refetch();
  }

  useEffect(() => {
    if (!token || !user?.client_id) return;

    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent<ClientsRefreshDetail>).detail;
      if (!shouldRefreshClient(detail, user.client_id)) return;
      if (detail?.scope === "board" || !detail?.scope) {
        reload({ silent: true });
      }
    };

    window.addEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
  }, [token, user?.client_id]);

  useEffect(() => {
    if (!token || !client?.documents?.length) return;
    prefetchDocuments(client.documents, token, 3);
  }, [client?.documents, token]);

  const isVerifying = client?.documents?.some(
    (d) => d.verification_status === "PENDIENTE" || d.verification_status === "EN_PROCESO",
  );

  useEffect(() => {
    if (!token || !isVerifying) return;
    const interval = window.setInterval(() => reload({ silent: true }), 5000);
    return () => window.clearInterval(interval);
  }, [token, isVerifying]);

  function mergeUploadedDoc(uploaded: DocumentBrief) {
    void documentsQuery.refetch();
  }

  async function handleUpload(docType: string, file: File) {
    if (!token) return;
    setUploading(docType);
    setMessage("");
    setIsError(false);
    try {
      const formData = new FormData();
      formData.append("document_type", docType);
      formData.append("file", file);

      const uploaded = await api.upload<DocumentBrief>("/documents/upload", formData, token);
      mergeUploadedDoc(uploaded);
      setMessage(t("portalDocs.uploadSuccess"));
      setIsError(false);
      reload({ silent: true });
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : t("portalDocs.uploadError"));
      setIsError(true);
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <Header title={t("portalDocs.headerContext")} subtitle={t("portalDocs.subtitle")} />
      <PageContent className="space-y-4">
        {message && (
          <div className={`alert ${isError ? "alert-error" : "alert-success"}`}>
            {message}
          </div>
        )}
        {loading ? (
          <PortalPageLoader label={t("portalDocs.loading")} />
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-600">{t("portalDocs.instructions")}</p>
            <DocumentRequirementsPanel
              documents={client?.documents}
              locale={locale}
              uploading={uploading}
              t={t}
              onUpload={handleUpload}
              variant="portal"
            />
          </>
        )}
      </PageContent>
    </>
  );
}
