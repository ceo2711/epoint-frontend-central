import type {
  ProspectCalendlyBrief,
  ProspectEnvelopeBrief,
  ProspectPaymentBrief,
  ProspectStatus,
} from "@/features/prospects/types";

const MEETING_DONE_STATUSES = new Set<ProspectStatus>([
  "LEAD_CONTACTADO",
  "CONTRATO_ENVIADO",
  "PAGO_COMPLETADO",
]);

export function isMeetingStepComplete(
  calendly: ProspectCalendlyBrief | null,
  status: ProspectStatus,
): boolean {
  return calendly != null && MEETING_DONE_STATUSES.has(status);
}

export function isContractStepComplete(envelopes: ProspectEnvelopeBrief[]): boolean {
  return envelopes.some((envelope) => envelope.status.toLowerCase() === "completed");
}

export function isPaymentStepComplete(payment: ProspectPaymentBrief | null): boolean {
  return payment?.status?.toLowerCase() === "paid";
}

export function isReadyForClientConversion(
  calendly: ProspectCalendlyBrief | null,
  status: ProspectStatus,
  envelopes: ProspectEnvelopeBrief[],
  payment: ProspectPaymentBrief | null,
): boolean {
  return (
    isMeetingStepComplete(calendly, status) &&
    isContractStepComplete(envelopes) &&
    isPaymentStepComplete(payment)
  );
}
