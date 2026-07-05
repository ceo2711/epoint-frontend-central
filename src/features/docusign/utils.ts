import type { DocusignEnvelope } from "@/features/docusign/types";

const TERMINAL_STATUSES = new Set(["completed", "declined", "voided"]);
const SENT_DOCUMENT_STATUSES = new Set(["sent", "delivered", "completed"]);

export function hasPendingEnvelopes(envelopes: DocusignEnvelope[]): boolean {
  return envelopes.some((envelope) => !TERMINAL_STATUSES.has(envelope.status.toLowerCase()));
}

export function canDownloadSentDocument(envelope: DocusignEnvelope): boolean {
  return SENT_DOCUMENT_STATUSES.has(envelope.status.toLowerCase());
}

export function canDownloadSignedDocument(envelope: DocusignEnvelope): boolean {
  return envelope.status.toLowerCase() === "completed";
}

export function parseSignerName(signerName: string): { firstName: string; lastName: string } {
  const parts = signerName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: "Firmante", lastName: "" };
}
