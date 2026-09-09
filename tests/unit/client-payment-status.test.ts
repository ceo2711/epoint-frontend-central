import { describe, expect, it } from "vitest";

import type { ProspectPaymentBrief } from "@/features/prospects/types";
import {
  clientPaymentSummaryStatus,
  isShareablePaymentUrl,
  remainingToStandard,
} from "@/features/clients/utils/clientPaymentStatus";

function brief(overrides: Partial<ProspectPaymentBrief> = {}): ProspectPaymentBrief {
  return {
    id: 1,
    amount: "3000.00",
    amount_paid: "0.00",
    remaining_amount: "3000.00",
    allow_partial: true,
    currency: "USD",
    status: "pending",
    payment_url: "https://example.com/pay",
    paid_at: null,
    remainder_due_on: null,
    created_at: "2026-09-08T00:00:00Z",
    ...overrides,
  };
}

describe("clientPaymentStatus", () => {
  it("detects shareable checkout URLs only", () => {
    expect(isShareablePaymentUrl("https://pay.example/abc")).toBe(true);
    expect(isShareablePaymentUrl("http://localhost:3000/pay")).toBe(true);
    expect(isShareablePaymentUrl("migration")).toBe(false);
    expect(isShareablePaymentUrl("")).toBe(false);
  });

  it("marks paid in full when the USD 3000 initial payment is covered", () => {
    const links = [brief({ amount_paid: "1500", status: "partial" }), brief({ id: 2, amount_paid: "1500", status: "paid" })];
    expect(remainingToStandard(links)).toBe(0);
    expect(clientPaymentSummaryStatus(links)).toBe("paid");
  });

  it("marks partial when some amount was paid but the standard remains", () => {
    const links = [brief({ amount_paid: "1000", status: "partial" })];
    expect(remainingToStandard(links)).toBe(2000);
    expect(clientPaymentSummaryStatus(links)).toBe("partial");
  });

  it("marks pending or empty when nothing was paid", () => {
    expect(clientPaymentSummaryStatus([])).toBe("empty");
    expect(clientPaymentSummaryStatus([brief()])).toBe("pending");
  });
});
