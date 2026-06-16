"use client";

import { useEffect, useState } from "react";

import { fetchPdfFirstPageThumbnailFromApi } from "@/features/documents/utils/pdfThumbnail";

interface PdfPageThumbnailProps {
  documentId: number;
  token: string | null;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}

export function PdfPageThumbnail({ documentId, token, alt, className, fallback }: PdfPageThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }

    let cancelled = false;

    fetchPdfFirstPageThumbnailFromApi(documentId, token)
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, token]);

  if (failed) return <>{fallback}</>;

  if (!src) {
    return (
      <div
        className={`animate-pulse bg-slate-100 ${className ?? ""}`}
        aria-hidden="true"
      />
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
