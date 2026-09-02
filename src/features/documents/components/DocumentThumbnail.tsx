"use client";

import { useState } from "react";

import { DocumentViewerModal } from "@/features/documents/components/DocumentViewerModal";
import { useSensitiveDocumentAccess } from "@/features/documents/hooks/useSensitiveDocumentAccess";
import { isPdfMime, inferMimeFromFilename } from "@/features/documents/utils/documentMime";
import { useAuth } from "@/features/auth/AuthContext";
import { useDocumentContentUrl } from "@/features/documents/hooks/useDocumentContentUrl";
import { useTranslation } from "@/contexts/LanguageContext";
import type { DocumentBrief } from "@/types/api";

interface DocumentThumbnailProps {
  doc: DocumentBrief;
  viewLabel: string;
}

function BlurredSensitiveThumb({ viewLabel }: { viewLabel: string }) {
  const { t } = useTranslation();
  return (
    <span className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-200">
      <span className="absolute inset-0 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 blur-md" />
      <span className="relative z-10 flex flex-col items-center gap-0.5 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
        <span className="px-1 text-center text-[9px] font-semibold uppercase leading-tight">
          {t("sensitiveDocs.locked")}
        </span>
      </span>
      <span className="sr-only">{viewLabel}</span>
    </span>
  );
}

export function DocumentThumbnail({ doc, viewLabel }: DocumentThumbnailProps) {
  const [open, setOpen] = useState(false);
  const { token } = useAuth();
  const { ensureAccess, modal } = useSensitiveDocumentAccess();
  const isPdf = isPdfMime(doc.mime_type ?? inferMimeFromFilename(doc.original_filename));

  const { url: contentUrl, loading: contentLoading } = useDocumentContentUrl(
    doc.id,
    token,
    open && !isPdf,
    doc.mime_type,
    doc.original_filename,
  );

  async function openViewer() {
    const allowed = await ensureAccess(doc.type);
    if (allowed) setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className="group flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        title={viewLabel}
        onClick={() => void openViewer()}
      >
        <BlurredSensitiveThumb viewLabel={viewLabel} />
      </button>
      {modal}
      {open && (
        <DocumentViewerModal
          url={contentUrl ?? ""}
          loading={!isPdf && (contentLoading || !contentUrl)}
          filename={doc.original_filename}
          mimeType={doc.mime_type}
          pdfSource={
            isPdf && token
              ? {
                  kind: "document",
                  id: doc.id,
                  token,
                  mimeType: doc.mime_type,
                  filename: doc.original_filename,
                }
              : undefined
          }
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
