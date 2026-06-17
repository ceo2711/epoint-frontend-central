"use client";

import { useEffect, useState, type ReactNode } from "react";

import { DocumentViewerModal } from "@/features/documents/components/DocumentViewerModal";
import { ImageContentThumbnail } from "@/features/documents/components/ImageContentThumbnail";
import { PdfPageThumbnail } from "@/features/documents/components/PdfPageThumbnail";
import { isImageMime, isPdfMime, inferMimeFromFilename } from "@/features/documents/utils/documentMime";
import { useAuth } from "@/features/auth/AuthContext";
import { useDocumentContentUrl } from "@/features/documents/hooks/useDocumentContentUrl";
import { prefetchDocumentContent } from "@/lib/contentBlobCache";
import type { DocumentBrief } from "@/types/api";

interface DocumentThumbnailProps {
  doc: DocumentBrief;
  viewLabel: string;
}

function PdfFallbackIcon() {
  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide">PDF</span>
    </>
  );
}

export function DocumentThumbnail({ doc, viewLabel }: DocumentThumbnailProps) {
  const [open, setOpen] = useState(false);
  const { token } = useAuth();
  const effectiveMime = doc.mime_type ?? inferMimeFromFilename(doc.original_filename);
  const isPdf = isPdfMime(effectiveMime);

  const { url: contentUrl, loading: contentLoading } = useDocumentContentUrl(
    doc.id,
    token,
    open && !isPdf,
    doc.mime_type,
    doc.original_filename,
  );

  useEffect(() => {
    if (!token) return;
    prefetchDocumentContent(doc.id, token, doc.mime_type, doc.original_filename);
  }, [doc.id, doc.mime_type, doc.original_filename, token]);

  const openViewer = () => setOpen(true);

  const thumbClass =
    "group shrink-0 cursor-pointer rounded-xl border border-slate-200 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

  let thumb: ReactNode;

  if (isImageMime(effectiveMime)) {
    thumb = (
      <button
        type="button"
        className={`${thumbClass} flex h-20 w-20 items-center justify-center overflow-hidden shadow-sm`}
        title={viewLabel}
        onClick={openViewer}
      >
        <ImageContentThumbnail
          documentId={doc.id}
          token={token}
          alt={doc.original_filename}
          mimeType={doc.mime_type}
          className="h-full w-full"
        />
      </button>
    );
  } else if (isPdf) {
    thumb = (
      <button
        type="button"
        className={`${thumbClass} flex h-20 w-20 items-center justify-center overflow-hidden shadow-sm`}
        title={viewLabel}
        onClick={openViewer}
      >
        <PdfPageThumbnail
          documentId={doc.id}
          token={token}
          alt={doc.original_filename}
          mimeType={doc.mime_type}
          className="h-full w-full"
          fallback={
            <span className="flex h-full w-full flex-col items-center justify-center border-red-100 bg-red-50 text-red-600">
              <PdfFallbackIcon />
            </span>
          }
        />
      </button>
    );
  } else {
    thumb = (
      <button
        type="button"
        className={`${thumbClass} flex h-20 w-20 items-center justify-center bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100`}
        title={viewLabel}
        onClick={openViewer}
      >
        {viewLabel}
      </button>
    );
  }

  return (
    <>
      {thumb}
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
