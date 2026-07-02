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
