import { describe, expect, it } from "vitest";

import {
  isDocumentsComplete,
  isDocumentsIncomplete,
  isProfileComplete,
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

  it("marks profile complete only after gaps are known and empty", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete(empty)).toBe(true);
    expect(isProfileComplete({ ...empty, profile_fields: ["ssn"] })).toBe(false);
  });

  it("marks documents incomplete for missing, rejected or expiring files", () => {
    expect(isDocumentsIncomplete(empty)).toBe(false);
    expect(isDocumentsIncomplete({ ...empty, missing_documents: ["SSN_CARD"] })).toBe(true);
    expect(isDocumentsIncomplete({ ...empty, rejected_documents: ["SSN_CARD"] })).toBe(true);
    expect(isDocumentsIncomplete({ ...empty, expiring_documents: ["UTILITY_BILL"] })).toBe(true);
  });

  it("marks documents complete only after gaps are known and empty", () => {
    expect(isDocumentsComplete(undefined)).toBe(false);
    expect(isDocumentsComplete(empty)).toBe(true);
    expect(isDocumentsComplete({ ...empty, missing_documents: ["SSN_CARD"] })).toBe(false);
  });
});
