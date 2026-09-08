import { describe, expect, it } from "vitest";

import {
  parseQualificationValue,
  qualificationSelectValue,
} from "@/features/prospects/components/ProspectQualificationField";

describe("qualification field", () => {
  it("permite dejar la calificación sin definir", () => {
    expect(parseQualificationValue("")).toBeNull();
    expect(qualificationSelectValue(null)).toBe("");
    expect(qualificationSelectValue(undefined)).toBe("");
  });

  it("mapea lead calificado y no calificado", () => {
    expect(parseQualificationValue("1")).toBe(true);
    expect(parseQualificationValue("0")).toBe(false);
    expect(qualificationSelectValue(true)).toBe("1");
    expect(qualificationSelectValue(false)).toBe("0");
  });
});
