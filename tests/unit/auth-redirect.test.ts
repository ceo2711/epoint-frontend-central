import { describe, expect, it } from "vitest";

import { getDefaultAppPath, mustForcePasswordChange } from "@/features/auth/auth-redirect";

describe("auth-redirect", () => {
  it("sends clients to portal and staff to dashboard", () => {
    expect(getDefaultAppPath("CLIENT")).toBe("/portal");
    expect(getDefaultAppPath("ADMIN")).toBe("/dashboard");
  });

  it("detects forced password change", () => {
    expect(mustForcePasswordChange({ must_change_password: true })).toBe(true);
    expect(mustForcePasswordChange({ must_change_password: false })).toBe(false);
    expect(mustForcePasswordChange(null)).toBe(false);
  });

  it("does not force password change for the App Review account", () => {
    expect(
      mustForcePasswordChange({
        must_change_password: true,
        email: "appreview@epoint.com",
      }),
    ).toBe(false);
  });
});
