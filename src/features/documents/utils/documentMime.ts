export function isImageMime(mimeType?: string | null) {
  return !!mimeType?.startsWith("image/");
}

export function isPdfMime(mimeType?: string | null) {
  return mimeType === "application/pdf" || mimeType === "application/x-pdf";
}

const EXTENSION_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function inferMimeFromFilename(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? (EXTENSION_MIME[ext] ?? null) : null;
}

export function resolveMimeType(
  filename: string,
  mimeType?: string | null,
  responseMimeType?: string | null,
): string {
  if (mimeType) return mimeType;
  if (responseMimeType && responseMimeType !== "application/octet-stream") {
    return responseMimeType;
  }
  return inferMimeFromFilename(filename) ?? responseMimeType ?? "application/octet-stream";
}

export function createObjectUrlFromBuffer(data: ArrayBuffer, mimeType: string): string {
  return URL.createObjectURL(new Blob([data], { type: mimeType }));
}
