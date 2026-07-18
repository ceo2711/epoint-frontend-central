export const PAYMENT_COMPLETED_EVENT = "epoint:payment-completed";

export type PaymentCompletedDetail = {
  paymentLinkId?: number;
  prospectId?: number | null;
};

export function dispatchPaymentCompleted(detail?: PaymentCompletedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PaymentCompletedDetail>(PAYMENT_COMPLETED_EVENT, { detail }));
}
