"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";

export function useDocumentContentUrl(documentId: number | null, token: string | null, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reset = useCallback(() => {
    setUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setError(false);
  }, []);

  useEffect(() => {
    if (!enabled || !documentId || !token) {
      reset();
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);

    api
      .getBlob(`/documents/${documentId}/content`, token)
      .then((data) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([data]));
        setUrl(objectUrl);
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
  }, [documentId, token, enabled, reset]);

  return { url, loading, error, reset };
}
