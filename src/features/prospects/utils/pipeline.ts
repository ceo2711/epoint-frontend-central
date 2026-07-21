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

export function isPaymentStepComplete(
  payment: ProspectPaymentBrief | null,
  payments: ProspectPaymentBrief[] = [],
): boolean {
  if (payments.some((item) => item.status?.toLowerCase() === "paid")) return true;
  return payment?.status?.toLowerCase() === "paid";
}

/** Preferí pagado, luego pendiente, luego el principal / más reciente. */
export function pickPreferredPayment(
  payment: ProspectPaymentBrief | null,
  payments: ProspectPaymentBrief[] = [],
): ProspectPaymentBrief | null {
  const list = payments.length > 0 ? payments : payment ? [payment] : [];
  if (list.length === 0) return null;
  return (
    list.find((item) => item.status?.toLowerCase() === "paid") ??
    list.find((item) => item.status?.toLowerCase() === "pending") ??
    payment ??
    list[0] ??
    null
  );
}

export function isReadyForClientConversion(
  calendly: ProspectCalendlyBrief | null,
  status: ProspectStatus,
  envelopes: ProspectEnvelopeBrief[],
  payment: ProspectPaymentBrief | null,
  payments: ProspectPaymentBrief[] = [],
): boolean {
  return (
    isMeetingStepComplete(calendly, status) &&
    isContractStepComplete(envelopes) &&
    isPaymentStepComplete(payment, payments)
  );
}
