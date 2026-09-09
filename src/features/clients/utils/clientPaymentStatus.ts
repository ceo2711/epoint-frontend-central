import { DEFAULT_PAYMENT_AMOUNT } from "@/features/payments/types";
import type { ProspectPaymentBrief } from "@/features/prospects/types";

export type ClientPaymentSummaryStatus = "paid" | "partial" | "pending" | "empty";

export function isShareablePaymentUrl(url: string | null | undefined): boolean {
  const value = (url ?? "").trim();
  return value.startsWith("https://") || value.startsWith("http://");
}

export function paidTowardStandard(links: ProspectPaymentBrief[]): number {
  return links.reduce((sum, item) => sum + Number(item.amount_paid ?? 0), 0);
}

export function remainingToStandard(links: ProspectPaymentBrief[]): number {
  return Math.max(0, DEFAULT_PAYMENT_AMOUNT - paidTowardStandard(links));
}

export function clientPaymentSummaryStatus(
  links: ProspectPaymentBrief[],
): ClientPaymentSummaryStatus {
  if (!links.length) return "empty";
  const remaining = remainingToStandard(links);
  const paid = paidTowardStandard(links);
  if (remaining <= 0.009) return "paid";
  if (paid > 0.009) return "partial";
  return "pending";
}

export function remainderDueOn(links: ProspectPaymentBrief[]): string | null {
  return links.find((item) => item.remainder_due_on)?.remainder_due_on ?? null;
}
