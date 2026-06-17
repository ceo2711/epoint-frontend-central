"use client";

import { useEffect, useState } from "react";

import { THUMBNAIL_IMG_CLASS } from "@/features/documents/components/ImageContentThumbnail";
import { inferMimeFromFilename, isImageMime, isPdfMime } from "@/features/documents/utils/documentMime";
import { fetchPdfFirstPageThumbnailFromAttachment } from "@/features/documents/utils/pdfThumbnail";
import {
  getAttachmentThumbnailUrl,
  peekAttachmentThumbnailUrl,
  prefetchAttachmentContent,
} from "@/lib/contentBlobCache";
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
  mimeType,
}: {
  attachmentId: number;
  token: string | null;
  alt: string;
  className: string;
  mimeType?: string | null;
}) {
  const [src, setSrc] = useState<string | null>(() => peekAttachmentThumbnailUrl(attachmentId));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }

    prefetchAttachmentContent(attachmentId, token, mimeType, alt);

    const cached = peekAttachmentThumbnailUrl(attachmentId);
    if (cached) {
      setSrc(cached);
      setFailed(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;

    const load = () => {
      getAttachmentThumbnailUrl(attachmentId, token, mimeType, alt)
        .then((objectUrl) => {
          if (!cancelled) {
            setSrc(objectUrl);
            setFailed(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 1) {
            attempt += 1;
            window.setTimeout(load, 800);
            return;
          }
          setFailed(true);
        });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [attachmentId, token, alt, mimeType]);

  if (failed) {
    return <span className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 ${className}`}>IMG</span>;
  }
  if (!src) {
    return <div className={`animate-pulse bg-slate-100 ${className}`} aria-hidden="true" />;
  }
  return <img src={src} alt={alt} className={`${THUMBNAIL_IMG_CLASS} ${className}`} />;
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
  mimeType,
}: {
  attachmentId: number;
  token: string | null;
  alt: string;
  className: string;
  mimeType?: string | null;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    let attempt = 0;

    const load = () => {
      fetchPdfFirstPageThumbnailFromAttachment(attachmentId, token, mimeType, alt)
        .then((dataUrl) => {
          if (!cancelled) {
            setSrc(dataUrl);
            setFailed(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 1) {
            attempt += 1;
            window.setTimeout(load, 800);
            return;
          }
          setFailed(true);
        });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [attachmentId, token, mimeType, alt]);

  if (failed) {
    return (
      <span className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 ${className}`}>
        <PdfFallbackIcon />
      </span>
    );
  }

  if (!src) {
    return <div className={`animate-pulse bg-slate-100 ${className}`} aria-hidden="true" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`${THUMBNAIL_IMG_CLASS} ${className}`} />;
}

export function CardAttachmentThumbnail({
  attachment,
  token,
  onView,
  size = "md",
}: CardAttachmentThumbnailProps) {
  const effectiveMime = attachment.mime_type ?? inferMimeFromFilename(attachment.original_filename);
  const isImage = isImageMime(effectiveMime);
  const isPdf = isPdfMime(effectiveMime);
  const previewClass = size === "sm" ? "h-16 w-16" : "h-24 w-full";
  const wrapperClass =
    size === "sm"
      ? "inline-flex shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-sm"
      : "group flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-blue-300 hover:shadow-sm";

  return (
    <button type="button" onClick={onView} className={wrapperClass} title={attachment.original_filename}>
      <div className={`flex items-center justify-center overflow-hidden bg-slate-50 ${previewClass}`}>
        {isImage ? (
          <ImageAttachmentThumb
            attachmentId={attachment.id}
            token={token}
            alt={attachment.original_filename}
            mimeType={attachment.mime_type}
            className={previewClass}
          />
        ) : isPdf ? (
          <PdfThumb
            attachmentId={attachment.id}
            token={token}
            alt={attachment.original_filename}
            mimeType={attachment.mime_type}
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
