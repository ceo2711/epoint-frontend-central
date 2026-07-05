import { createObjectUrlFromBuffer, inferMimeFromFilename, isPdfMime, resolveMimeType } from "@/features/documents/utils/documentMime";
import { api } from "@/lib/api";

interface CachedBlob {
  data: ArrayBuffer;
  mimeType: string;
}

const documentCache = new Map<number, CachedBlob>();
const documentInflight = new Map<number, Promise<CachedBlob>>();
const documentThumbnailUrls = new Map<number, string>();

const attachmentCache = new Map<number, CachedBlob>();
const attachmentInflight = new Map<number, Promise<CachedBlob>>();
const attachmentThumbnailUrls = new Map<number, string>();

async function loadDocument(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<CachedBlob> {
  const cached = documentCache.get(documentId);
  if (cached) return cached;

  let pending = documentInflight.get(documentId);
  if (!pending) {
    pending = api
      .getBlob(`/documents/${documentId}/content`, token)
      .then(({ data, mimeType: responseMime }) => {
        const type = resolveMimeType(filename ?? "", mimeType, responseMime);
        const entry: CachedBlob = { data: data.slice(0), mimeType: type };
        documentCache.set(documentId, entry);
        documentInflight.delete(documentId);
        return entry;
      })
      .catch((error) => {
        documentInflight.delete(documentId);
        throw error;
      });
    documentInflight.set(documentId, pending);
  }

  return pending;
}

async function loadAttachment(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<CachedBlob> {
  const cached = attachmentCache.get(attachmentId);
  if (cached) return cached;

  let pending = attachmentInflight.get(attachmentId);
  if (!pending) {
    pending = api
      .getBlob(`/boards/attachments/${attachmentId}/content`, token)
      .then(({ data, mimeType: responseMime }) => {
        const type = resolveMimeType(filename ?? "", mimeType, responseMime);
        const entry: CachedBlob = { data: data.slice(0), mimeType: type };
        attachmentCache.set(attachmentId, entry);
        attachmentInflight.delete(attachmentId);
        return entry;
      })
      .catch((error) => {
        attachmentInflight.delete(attachmentId);
        throw error;
      });
    attachmentInflight.set(attachmentId, pending);
  }

  return pending;
}

function getOrCreateThumbnailUrl(
  thumbMap: Map<number, string>,
  id: number,
  entry: CachedBlob,
): string {
  const existing = thumbMap.get(id);
  if (existing) return existing;
  const url = createObjectUrlFromBuffer(entry.data, entry.mimeType);
  thumbMap.set(id, url);
  return url;
}

export function peekDocumentThumbnailUrl(documentId: number): string | null {
  return documentThumbnailUrls.get(documentId) ?? null;
}

export function peekAttachmentThumbnailUrl(attachmentId: number): string | null {
  return attachmentThumbnailUrls.get(attachmentId) ?? null;
}

/** @deprecated Use peekDocumentThumbnailUrl or viewer-specific APIs */
export function peekDocumentContentUrl(documentId: number): string | null {
  return peekDocumentThumbnailUrl(documentId);
}

/** @deprecated Use peekAttachmentThumbnailUrl or viewer-specific APIs */
export function peekAttachmentContentUrl(attachmentId: number): string | null {
  return peekAttachmentThumbnailUrl(attachmentId);
}

export function prefetchDocumentContent(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): void {
  void loadDocument(documentId, token, mimeType, filename).catch(() => {});
}

export function prefetchAttachmentContent(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): void {
  void loadAttachment(attachmentId, token, mimeType, filename).catch(() => {});
}

export function prefetchDocuments(
  documents: Array<{ id: number; mime_type?: string | null; original_filename: string }>,
  token: string,
  limit = 3,
): void {
  for (const doc of documents.slice(0, limit)) {
    if (isPdfMime(doc.mime_type ?? inferMimeFromFilename(doc.original_filename))) {
      continue;
    }
    prefetchDocumentContent(doc.id, token, doc.mime_type, doc.original_filename);
  }
}

export function prefetchAttachments(
  attachments: Array<{ id: number; mime_type?: string | null; original_filename: string }>,
  token: string,
): void {
  for (const attachment of attachments) {
    prefetchAttachmentContent(attachment.id, token, attachment.mime_type, attachment.original_filename);
  }
}

export async function getDocumentThumbnailUrl(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  const entry = await loadDocument(documentId, token, mimeType, filename);
  return getOrCreateThumbnailUrl(documentThumbnailUrls, documentId, entry);
}

export async function getAttachmentThumbnailUrl(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  const entry = await loadAttachment(attachmentId, token, mimeType, filename);
  return getOrCreateThumbnailUrl(attachmentThumbnailUrls, attachmentId, entry);
}

/** Fresh blob URL for the viewer — revoke when the modal closes. */
export async function getDocumentViewerUrl(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  const entry = await loadDocument(documentId, token, mimeType, filename);
  return createObjectUrlFromBuffer(entry.data, entry.mimeType);
}

/** Fresh blob URL for the viewer — revoke when the modal closes. */
export async function getAttachmentViewerUrl(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  const entry = await loadAttachment(attachmentId, token, mimeType, filename);
  return createObjectUrlFromBuffer(entry.data, entry.mimeType);
}

export async function getDocumentArrayBuffer(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<ArrayBuffer> {
  const entry = await loadDocument(documentId, token, mimeType, filename);
  return entry.data;
}

export async function getAttachmentArrayBuffer(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<ArrayBuffer> {
  const entry = await loadAttachment(attachmentId, token, mimeType, filename);
  return entry.data;
}

/** @deprecated Use getDocumentViewerUrl */
export async function getDocumentContentUrl(
  documentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  return getDocumentViewerUrl(documentId, token, mimeType, filename);
}

/** @deprecated Use getAttachmentViewerUrl */
export async function getAttachmentContentUrl(
  attachmentId: number,
  token: string,
  mimeType?: string | null,
  filename?: string,
): Promise<string> {
  return getAttachmentViewerUrl(attachmentId, token, mimeType, filename);
}
