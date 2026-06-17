"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

export function useAttachmentContentUrl(attachmentId: number | null, token: string | null, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !attachmentId || !token) {
      setUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    api
      .getBlob(`/boards/attachments/${attachmentId}/content`, token)
      .then((data) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([data]));
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId, token, enabled]);

  return url;
}
