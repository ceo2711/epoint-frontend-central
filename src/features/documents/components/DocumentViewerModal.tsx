"use client";

import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/contexts/LanguageContext";

interface DocumentViewerModalProps {
  url: string;
  filename: string;
  mimeType?: string | null;
  title?: string;
  onClose: () => void;
}

function isImageMime(mimeType?: string | null) {
  return !!mimeType?.startsWith("image/");
}

function isPdfMime(mimeType?: string | null) {
  return mimeType === "application/pdf";
}

export function DocumentViewerModal({
  url,
  filename,
  mimeType,
  title,
  onClose,
}: DocumentViewerModalProps) {
  const { t } = useTranslation();
  const isImage = isImageMime(mimeType);
  const isPdf = isPdfMime(mimeType);

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
          {isImage && (
            <img
              src={url}
              alt={filename}
              className="mx-auto max-h-[70vh] w-auto max-w-full object-contain p-2"
            />
          )}
          {isPdf && (
            <iframe src={url} title={filename} className="h-[70vh] w-full rounded-xl" />
          )}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-sm text-slate-600">{filename}</p>
              <a href={url} download={filename} className="btn btn-primary btn-sm">
                {t("portalDocs.downloadDocument")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
