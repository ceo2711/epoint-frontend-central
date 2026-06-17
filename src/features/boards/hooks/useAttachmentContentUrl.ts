"use client";

import { useEffect, useState } from "react";

import { getAttachmentViewerUrl } from "@/lib/contentBlobCache";

export function useAttachmentContentUrl(
  attachmentId: number | null,
  token: string | null,
  enabled: boolean,
  mimeType?: string | null,
  filename?: string,
) {
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

    getAttachmentViewerUrl(attachmentId, token, mimeType, filename)
      .then((viewerUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(viewerUrl);
          return;
        }
        objectUrl = viewerUrl;
        setUrl(viewerUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId, token, enabled, mimeType, filename]);

  return url;
}
