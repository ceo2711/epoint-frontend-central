"use client";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PdfJsViewer, type PdfContentSource } from "@/features/documents/components/PdfJsViewer";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  isImageMime,
  isPdfMime,
  resolveMimeType,
} from "@/features/documents/utils/documentMime";

interface DocumentViewerModalProps {
  url: string;
  filename: string;
  mimeType?: string | null;
  title?: string;
  loading?: boolean;
  pdfSource?: PdfContentSource;
  onClose: () => void;
}

export function DocumentViewerModal({
  url,
  filename,
  mimeType,
  title,
  loading = false,
  pdfSource,
  onClose,
}: DocumentViewerModalProps) {
  const { t } = useTranslation();
  const effectiveMime = resolveMimeType(filename, mimeType);
  const isImage = isImageMime(effectiveMime);
  const isPdf = isPdfMime(effectiveMime);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900">{title ?? filename}</h2>
            {title && title !== filename && (
              <p className="mt-0.5 truncate text-sm text-slate-500">{filename}</p>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
        <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-slate-50">
          {isPdf && pdfSource ? (
            <PdfJsViewer source={pdfSource} />
          ) : loading || !url ? (
            <div className="flex h-[50vh] items-center justify-center p-8">
              <LoadingSpinner label={t("common.loading")} />
            </div>
          ) : (
            <>
              {isImage && (
                <img
                  src={url}
                  alt={filename}
                  className="mx-auto max-h-[70vh] w-auto max-w-full object-contain p-2"
                />
              )}
              {isPdf && !pdfSource && (
                <div className="flex h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
                  <p className="text-sm text-slate-600">{t("portalDocs.pdfLoadError")}</p>
                  <a href={url} download={filename} className="btn btn-primary btn-sm">
                    {t("portalDocs.downloadDocument")}
                  </a>
                </div>
              )}
              {!isImage && !isPdf && (
                <div className="flex flex-col items-center gap-4 p-10 text-center">
                  <p className="text-sm text-slate-600">{filename}</p>
                  <a href={url} download={filename} className="btn btn-primary btn-sm">
                    {t("portalDocs.downloadDocument")}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
