export function isImageMime(mimeType?: string | null) {
  return !!mimeType?.startsWith("image/");
}

export function isPdfMime(mimeType?: string | null) {
  return mimeType === "application/pdf" || mimeType === "application/x-pdf";
}
