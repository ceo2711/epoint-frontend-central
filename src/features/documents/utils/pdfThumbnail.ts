import { getAttachmentArrayBuffer, getDocumentArrayBuffer } from "@/lib/contentBlobCache";

export const PDF_THUMB_RENDER_PX = 280;
export const PDF_VIEWER_SCALE = 1.35;

const documentPdfThumbCache = new Map<number, string>();
const documentPdfThumbInflight = new Map<number, Promise<string>>();
const attachmentPdfThumbCache = new Map<number, string>();
const attachmentPdfThumbInflight = new Map<number, Promise<string>>();

let workerConfigured = false;

export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjs;
}

function clonePdfData(data: ArrayBuffer): ArrayBuffer {
  return data.slice(0);
}

export async function renderPdfFirstPageToDataUrl(
  pdfjs: Awaited<ReturnType<typeof loadPdfJs>>,
  data: ArrayBuffer,
  renderPx = PDF_THUMB_RENDER_PX,
): Promise<string> {
  const doc = await pdfjs.getDocument({ data: clonePdfData(data) }).promise;
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
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/png");
  } finally {
    await doc.destroy();
  }
}

export async function renderPdfToContainer(
  container: HTMLElement,
  data: ArrayBuffer,
  scale = PDF_VIEWER_SCALE,
): Promise<void> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: clonePdfData(data) }).promise;
  try {
    container.replaceChildren();
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.className = "mx-auto mb-4 block max-w-full rounded-lg bg-white shadow-sm";
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas not supported");
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      container.appendChild(canvas);
    }
  } finally {
    await doc.destroy();
  }
}

export async function fetchPdfFirstPageThumbnailFromApi(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  const cached = documentPdfThumbCache.get(documentId);
  if (cached) return cached;

  let pending = documentPdfThumbInflight.get(documentId);
  if (!pending) {
    pending = (async () => {
      const data = await getDocumentArrayBuffer(documentId, token, mimeType, filename);
      const pdfjs = await loadPdfJs();
      const dataUrl = await renderPdfFirstPageToDataUrl(pdfjs, data);
      documentPdfThumbCache.set(documentId, dataUrl);
      documentPdfThumbInflight.delete(documentId);
      return dataUrl;
    })().catch((error) => {
      documentPdfThumbInflight.delete(documentId);
      throw error;
    });
    documentPdfThumbInflight.set(documentId, pending);
  }

  return pending;
}

export async function fetchPdfFirstPageThumbnailFromAttachment(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  const cached = attachmentPdfThumbCache.get(attachmentId);
  if (cached) return cached;

  let pending = attachmentPdfThumbInflight.get(attachmentId);
  if (!pending) {
    pending = (async () => {
      const data = await getAttachmentArrayBuffer(attachmentId, token, mimeType, filename);
      const pdfjs = await loadPdfJs();
      const dataUrl = await renderPdfFirstPageToDataUrl(pdfjs, data);
      attachmentPdfThumbCache.set(attachmentId, dataUrl);
      attachmentPdfThumbInflight.delete(attachmentId);
      return dataUrl;
    })().catch((error) => {
      attachmentPdfThumbInflight.delete(attachmentId);
      throw error;
    });
    attachmentPdfThumbInflight.set(attachmentId, pending);
  }

  return pending;
}

export async function loadPdfDataForDocument(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<ArrayBuffer> {
  return getDocumentArrayBuffer(documentId, token, mimeType, filename);
}

export async function loadPdfDataForAttachment(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<ArrayBuffer> {
  return getAttachmentArrayBuffer(attachmentId, token, mimeType, filename);
}
