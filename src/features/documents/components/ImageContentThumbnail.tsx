"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

interface ImageContentThumbnailProps {
  documentId: number;
  token: string | null;
  alt: string;
  className?: string;
}

export function ImageContentThumbnail({ documentId, token, alt, className }: ImageContentThumbnailProps) {
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
      .getBlob(`/documents/${documentId}/content`, token)
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
  }, [documentId, token]);

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

  return <img src={src} alt={alt} className={className} />;
}
