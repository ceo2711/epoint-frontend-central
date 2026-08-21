import { describe, expect, it } from "vitest";

import { isAppReviewEmail } from "@/lib/app-review";

describe("isAppReviewEmail", () => {
  it("matches the Apple review account only", () => {
    expect(isAppReviewEmail("appreview@epoint.com")).toBe(true);
    expect(isAppReviewEmail("AppReview@epoint.com")).toBe(true);
    expect(isAppReviewEmail("cliente@epoint.com")).toBe(false);
    expect(isAppReviewEmail("guaniquediaz@gmail.com")).toBe(false);
    expect(isAppReviewEmail(null)).toBe(false);
  });
});
