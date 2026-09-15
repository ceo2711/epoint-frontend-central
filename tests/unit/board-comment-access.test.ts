import { describe, expect, it } from "vitest";

import { canDeleteBoardComments, canEditBoardComments } from "@/lib/roles";

function user(role: string, area?: string) {
  return {
    role: { code: role },
    area: area ? { code: area } : null,
  };
}

describe("canEditBoardComments", () => {
  it("allows onboarding staff on a client board", () => {
    expect(canEditBoardComments(user("AREA_LEADER", "ONBOARDING"))).toBe(true);
    expect(canEditBoardComments(user("AREA_LEADER", "ASESORES"))).toBe(true);
    expect(canEditBoardComments(user("ADVISOR"))).toBe(true);
    expect(canEditBoardComments(user("ADMIN"))).toBe(true);
    expect(canEditBoardComments(user("BRANCH_MANAGER"))).toBe(true);
  });

  it("rejects the client and sales team", () => {
    expect(canEditBoardComments(user("CLIENT"))).toBe(false);
    expect(canEditBoardComments(user("SALES_REP", "VENTAS"))).toBe(false);
    expect(canEditBoardComments(user("AREA_LEADER", "VENTAS"))).toBe(false);
    expect(canEditBoardComments(null)).toBe(false);
  });

  it("lets the same onboarding roles delete comments", () => {
    expect(canDeleteBoardComments(user("AREA_LEADER", "ONBOARDING"))).toBe(true);
    expect(canDeleteBoardComments(user("ADVISOR"))).toBe(true);
    expect(canDeleteBoardComments(user("CLIENT"))).toBe(false);
  });
});
