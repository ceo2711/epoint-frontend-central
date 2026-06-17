"use client";

import { useEffect, useState } from "react";

import { getDocumentViewerUrl } from "@/lib/contentBlobCache";

export function useDocumentContentUrl(
  documentId: number | null,
  token: string | null,
  enabled: boolean,
  mimeType?: string | null,
  filename?: string,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled || !documentId || !token) {
      setUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);

    getDocumentViewerUrl(documentId, token, mimeType, filename)
      .then((viewerUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(viewerUrl);
          return;
        }
        objectUrl = viewerUrl;
        setUrl(viewerUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, token, enabled, mimeType, filename]);

  return { url, loading, error };
}
