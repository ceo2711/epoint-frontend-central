"use client";

import { useEffect, useState } from "react";

import { DocumentThumbnail } from "@/features/documents/components/DocumentThumbnail";
import { Header } from "@/components/layout/Header";
import { VerificationBadge } from "@/components/ui/Badge";
import { Card, PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { translateStatus } from "@/i18n";
import { ApiError, api } from "@/lib/api";
import { DOCUMENT_TYPES, type Client, type DocumentBrief } from "@/types/api";

export default function PortalDocumentosPage() {
  const { token } = useAuth();
  const { t, locale } = useTranslation();
  const [client, setClient] = useState<Client | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function reload() {
    if (!token) return;
    Promise.all([
      api.get<Client>("/portal/me", token),
      api.get<DocumentBrief[]>("/portal/documents", token),
    ]).then(([profile, documents]) => {
      setClient({ ...profile, documents });
    });
  }

  useEffect(() => {
    reload();
  }, [token]);

  const isVerifying = client?.documents?.some(
    (d) => d.verification_status === "PENDIENTE" || d.verification_status === "EN_PROCESO",
  );

  useEffect(() => {
    if (!token || !isVerifying) return;
    const interval = window.setInterval(() => reload(), 5000);
    return () => window.clearInterval(interval);
  }, [token, isVerifying]);

  function mergeUploadedDoc(uploaded: DocumentBrief) {
    setClient((prev) => {
      if (!prev) return prev;
      const others = (prev.documents ?? []).filter((d) => d.type !== uploaded.type);
      return { ...prev, documents: [...others, uploaded] };
    });
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
      reload();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : t("portalDocs.uploadError"));
      setIsError(true);
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <Header title={t("portalDocs.title")} subtitle={t("portalDocs.subtitle")} />
      <PageContent className="space-y-4">
        {message && (
          <div className={`alert ${isError ? "alert-error" : "alert-success"}`}>
            {message}
          </div>
        )}
        <p className="text-sm leading-relaxed text-slate-600">{t("portalDocs.instructions")}</p>
        <div className="grid gap-4">
          {DOCUMENT_TYPES.map((dt) => {
            const doc = client?.documents?.find((d) => d.type === dt.value);
            const label = translateStatus(locale, "documentTypes", dt.value);
            return (
              <Card key={dt.value} className="p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    {doc ? (
                      <DocumentThumbnail doc={doc} viewLabel={t("portalDocs.viewDocument")} />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">{label}</h3>
                      {doc ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-slate-500">{doc.original_filename}</span>
                          <VerificationBadge status={doc.verification_status} />
                        </div>
                      ) : (
                        <span className="badge badge-amber mt-1">{t("portalDocs.pendingUpload")}</span>
                      )}
                    </div>
                  </div>
                  <label className="block w-full md:w-auto md:justify-self-end">
                    <span
                      className={`btn btn-primary btn-sm w-full md:inline-flex md:w-auto md:whitespace-nowrap ${
                        uploading ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      {uploading === dt.value ? t("common.uploading") : t("common.upload")}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={!!uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(dt.value, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </Card>
            );
          })}
        </div>
      </PageContent>
    </>
  );
}
