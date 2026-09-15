import { describe, expect, it } from "vitest";

import { canManageBoardColumns } from "@/lib/roles";

function user(role: string, area?: string) {
  return {
    role: { code: role },
    area: area ? { code: area } : null,
  };
}

describe("canManageBoardColumns", () => {
  it("allows onboarding staff and advisors", () => {
    expect(canManageBoardColumns(user("AREA_LEADER", "ONBOARDING"))).toBe(true);
    expect(canManageBoardColumns(user("AREA_LEADER", "ASESORES"))).toBe(true);
    expect(canManageBoardColumns(user("ADVISOR"))).toBe(true);
    expect(canManageBoardColumns(user("ADMIN"))).toBe(true);
    expect(canManageBoardColumns(user("BRANCH_MANAGER"))).toBe(true);
  });

  it("rejects the client and sales team", () => {
    expect(canManageBoardColumns(user("CLIENT"))).toBe(false);
    expect(canManageBoardColumns(user("SALES_REP", "VENTAS"))).toBe(false);
    expect(canManageBoardColumns(user("AREA_LEADER", "VENTAS"))).toBe(false);
    expect(canManageBoardColumns(null)).toBe(false);
  });
});
