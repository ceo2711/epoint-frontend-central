import { describe, expect, it } from "vitest";

import {
  isDocumentsIncomplete,
  isProfileIncomplete,
} from "@/features/portal/onboardingGaps";
import type { OnboardingGaps } from "@/types/api";

const empty: OnboardingGaps = {
  profile_fields: [],
  missing_documents: [],
  rejected_documents: [],
  expiring_documents: [],
};

describe("onboardingGaps", () => {
  it("marks profile incomplete only when fields are missing", () => {
    expect(isProfileIncomplete(null)).toBe(false);
    expect(isProfileIncomplete(empty)).toBe(false);
    expect(isProfileIncomplete({ ...empty, profile_fields: ["ssn"] })).toBe(true);
  });

  it("marks documents incomplete for missing, rejected or expiring files", () => {
    expect(isDocumentsIncomplete(empty)).toBe(false);
    expect(isDocumentsIncomplete({ ...empty, missing_documents: ["SSN_CARD"] })).toBe(true);
    expect(isDocumentsIncomplete({ ...empty, rejected_documents: ["SSN_CARD"] })).toBe(true);
    expect(isDocumentsIncomplete({ ...empty, expiring_documents: ["UTILITY_BILL"] })).toBe(true);
  });
});
