"use client";

import { useEffect, useRef, useState } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  loadPdfDataForAttachment,
  loadPdfDataForDocument,
  renderPdfToContainer,
} from "@/features/documents/utils/pdfThumbnail";

export interface PdfContentSource {
  kind: "document" | "attachment";
  id: number;
  token: string;
  mimeType?: string | null;
  filename: string;
}

interface PdfJsViewerProps {
  source: PdfContentSource;
}

export function PdfJsViewer({ source }: PdfJsViewerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    container.replaceChildren();

    const loadData =
      source.kind === "document"
        ? () => loadPdfDataForDocument(source.id, source.token, source.mimeType, source.filename)
        : () => loadPdfDataForAttachment(source.id, source.token, source.mimeType, source.filename);

    loadData()
      .then((data) => {
        if (cancelled) return;
        return renderPdfToContainer(container, data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [source.kind, source.id, source.token, source.mimeType, source.filename]);

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-slate-600">{t("portalDocs.pdfLoadError")}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[50vh] p-3">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/90">
          <LoadingSpinner label={t("common.loading")} />
        </div>
      )}
      <div ref={containerRef} className="flex flex-col items-center" />
    </div>
  );
}
