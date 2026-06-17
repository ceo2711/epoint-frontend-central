"use client";

import { useEffect, useState } from "react";

import {
  getDocumentThumbnailUrl,
  peekDocumentThumbnailUrl,
  prefetchDocumentContent,
} from "@/lib/contentBlobCache";

export const THUMBNAIL_IMG_CLASS = "pointer-events-none h-full w-full object-contain";

interface ImageContentThumbnailProps {
  documentId: number;
  token: string | null;
  alt: string;
  className?: string;
  mimeType?: string | null;
}

export function ImageContentThumbnail({
  documentId,
  token,
  alt,
  className,
  mimeType,
}: ImageContentThumbnailProps) {
  const [src, setSrc] = useState<string | null>(() => peekDocumentThumbnailUrl(documentId));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }

    prefetchDocumentContent(documentId, token, mimeType, alt);

    const cached = peekDocumentThumbnailUrl(documentId);
    if (cached) {
      setSrc(cached);
      setFailed(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;

    const load = () => {
      getDocumentThumbnailUrl(documentId, token, mimeType, alt)
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
  }, [documentId, token, alt, mimeType]);

  if (failed) {
    return (
      <span className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 ${className ?? ""}`}>
        IMG
      </span>
    );
  }

  if (!src) {
    return <div className={`animate-pulse bg-slate-100 ${className ?? ""}`} aria-hidden="true" />;
  }

  return <img src={src} alt={alt} className={`${THUMBNAIL_IMG_CLASS} ${className ?? ""}`} />;
}
