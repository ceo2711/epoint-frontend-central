import { api } from "@/lib/api";

export const PDF_THUMB_RENDER_PX = 160;

let workerConfigured = false;

export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjs;
}

export async function renderPdfFirstPageToDataUrl(
  pdfjs: Awaited<ReturnType<typeof loadPdfJs>>,
  data: ArrayBuffer,
  renderPx = PDF_THUMB_RENDER_PX,
): Promise<string> {
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    const page = await doc.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = renderPx / Math.max(baseViewport.width, baseViewport.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas not supported");
    }
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    await doc.destroy();
  }
}

export async function fetchPdfFirstPageThumbnailFromApi(
  documentId: number,
  token: string,
): Promise<string> {
  const data = await api.getBlob(`/documents/${documentId}/content`, token);
  const pdfjs = await loadPdfJs();
  return renderPdfFirstPageToDataUrl(pdfjs, data);
}

export async function fetchPdfFirstPageThumbnailFromAttachment(
  attachmentId: number,
  token: string,
): Promise<string> {
  const data = await api.getBlob(`/boards/attachments/${attachmentId}/content`, token);
  const pdfjs = await loadPdfJs();
  return renderPdfFirstPageToDataUrl(pdfjs, data);
}
