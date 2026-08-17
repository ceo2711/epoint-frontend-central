"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
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
  onDownload?: () => void;
  onClose: () => void;
}

export function DocumentViewerModal({
  url,
  filename,
  mimeType,
  title,
  loading = false,
  pdfSource,
  onDownload,
  onClose,
}: DocumentViewerModalProps) {
  const { t } = useTranslation();
  const effectiveMime = resolveMimeType(filename, mimeType);
  const isImage = isImageMime(effectiveMime);
  const isPdf = isPdfMime(effectiveMime);
  const displayTitle = title ?? filename;

  return (
    <Modal
      title={displayTitle}
      subtitle={title && title !== filename ? filename : undefined}
      onClose={onClose}
      size="lg"
      usePortal={false}
    >
      <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50">
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
              </div>
            )}
            {!isImage && !isPdf && (
              <div className="flex flex-col items-center gap-4 p-10 text-center">
                <p className="text-sm text-slate-600">{filename}</p>
              </div>
            )}
          </>
        )}
      </div>
      {onDownload ? (
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onDownload}>
            {t("portalDocs.downloadDocument")}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
