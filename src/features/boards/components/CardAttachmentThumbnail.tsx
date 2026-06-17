"use client";

import { useEffect, useState } from "react";

import { isImageMime, isPdfMime } from "@/features/documents/utils/documentMime";
import { fetchPdfFirstPageThumbnailFromAttachment } from "@/features/documents/utils/pdfThumbnail";
import { api } from "@/lib/api";
import type { CardAttachment } from "@/features/boards/types";

interface CardAttachmentThumbnailProps {
  attachment: CardAttachment;
  token: string | null;
  onView: () => void;
  size?: "sm" | "md";
}

function ImageAttachmentThumb({
  attachmentId,
  token,
  alt,
  className,
}: {
  attachmentId: number;
  token: string | null;
  alt: string;
  className: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    api
      .getBlob(`/boards/attachments/${attachmentId}/content`, token)
      .then((data) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([data]));
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId, token]);

  if (failed) {
    return <span className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 ${className}`}>IMG</span>;
  }
  if (!src) {
    return <div className={`animate-pulse bg-slate-100 ${className}`} aria-hidden="true" />;
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} />;
}

function PdfFallbackIcon() {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-6 w-6"
      >
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">PDF</span>
    </>
  );
}

function PdfThumb({
  attachmentId,
  token,
  alt,
  className,
}: {
  attachmentId: number;
  token: string | null;
  alt: string;
  className: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    fetchPdfFirstPageThumbnailFromAttachment(attachmentId, token)
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachmentId, token]);

  if (failed) {
    return (
      <span className={`flex flex-col items-center justify-center bg-red-50 text-red-600 ${className}`}>
        <PdfFallbackIcon />
      </span>
    );
  }

  if (!src) {
    return <div className={`animate-pulse bg-slate-100 ${className}`} aria-hidden="true" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`object-cover ${className}`} />;
}

export function CardAttachmentThumbnail({
  attachment,
  token,
  onView,
  size = "md",
}: CardAttachmentThumbnailProps) {
  const isImage = isImageMime(attachment.mime_type);
  const isPdf = isPdfMime(attachment.mime_type);
  const previewClass = size === "sm" ? "h-16 w-16" : "h-24 w-full";
  const wrapperClass =
    size === "sm"
      ? "inline-flex shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-sm"
      : "group flex w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-blue-300 hover:shadow-sm";

  return (
    <button type="button" onClick={onView} className={wrapperClass} title={attachment.original_filename}>
      <div className={`flex items-center justify-center overflow-hidden bg-slate-50 ${previewClass}`}>
        {isImage ? (
          <ImageAttachmentThumb
            attachmentId={attachment.id}
            token={token}
            alt={attachment.original_filename}
            className={previewClass}
          />
        ) : isPdf ? (
          <PdfThumb
            attachmentId={attachment.id}
            token={token}
            alt={attachment.original_filename}
            className={previewClass}
          />
        ) : (
          <span className="text-xs font-bold uppercase text-slate-400">FILE</span>
        )}
      </div>
      {size === "md" && (
        <span className="truncate px-2 py-2 text-xs font-medium text-slate-700 group-hover:text-blue-700">
          {attachment.original_filename}
        </span>
      )}
    </button>
  );
}
