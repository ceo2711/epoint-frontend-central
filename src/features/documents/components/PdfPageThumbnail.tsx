"use client";

import { useEffect, useState } from "react";

import { THUMBNAIL_IMG_CLASS } from "@/features/documents/components/ImageContentThumbnail";
import { fetchPdfFirstPageThumbnailFromApi } from "@/features/documents/utils/pdfThumbnail";

interface PdfPageThumbnailProps {
  documentId: number;
  token: string | null;
  alt: string;
  className?: string;
  mimeType?: string | null;
  fallback: React.ReactNode;
}

export function PdfPageThumbnail({
  documentId,
  token,
  alt,
  className,
  mimeType,
  fallback,
}: PdfPageThumbnailProps) {
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
      fetchPdfFirstPageThumbnailFromApi(documentId, token, mimeType, alt)
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
  }, [documentId, token, mimeType, alt]);

  if (failed) return <>{fallback}</>;

  if (!src) {
    return (
      <div
        className={`animate-pulse bg-slate-100 ${className ?? ""}`}
        aria-hidden="true"
      />
    );
  }

  return <img src={src} alt={alt} className={`${THUMBNAIL_IMG_CLASS} ${className}`} />;
}
