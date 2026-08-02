import { describe, expect, it } from "vitest";

import {
  canEditClientProfile,
  canViewApprovedClientWorkspace,
  canViewClientOnboardingWorkspace,
} from "@/features/clients/client-access";
import type { AreaBrief, RoleBrief } from "@/types/api";

function role(code: string): RoleBrief {
  return { id: 1, code, name: code };
}

function area(id: number, code: string, name: string): AreaBrief {
  return { id, code, name };
}

describe("canViewClientOnboardingWorkspace", () => {
  it("permite admin, gerente, onboarding, líder onboarding y asesor", () => {
    expect(canViewClientOnboardingWorkspace({ id: 1, role: role("ADMIN"), area: null })).toBe(true);
    expect(
      canViewClientOnboardingWorkspace({ id: 1, role: role("BRANCH_MANAGER"), area: null }),
    ).toBe(true);
    expect(
      canViewClientOnboardingWorkspace({
        id: 1,
        role: role("AREA_LEADER"),
        area: area(2, "ONBOARDING", "Onboarding"),
      }),
    ).toBe(true);
    expect(canViewClientOnboardingWorkspace({ id: 1, role: role("ADVISOR"), area: null })).toBe(
      true,
    );
  });

  it("niega vendedor y líder de ventas", () => {
    expect(canViewClientOnboardingWorkspace({ id: 1, role: role("SALES_REP"), area: null })).toBe(
      false,
    );
    expect(
      canViewClientOnboardingWorkspace({
        id: 1,
        role: role("AREA_LEADER"),
        area: area(1, "VENTAS", "Ventas"),
      }),
    ).toBe(false);
    expect(canViewClientOnboardingWorkspace(null)).toBe(false);
  });
});

describe("canViewApprovedClientWorkspace", () => {
  const onboardingUser = { id: 1, role: role("AREA_LEADER"), area: area(2, "ONBOARDING", "Onboarding") };

  it("requiere cliente aprobado", () => {
    expect(canViewApprovedClientWorkspace(onboardingUser, { approved_at: null })).toBe(false);
    expect(canViewApprovedClientWorkspace(onboardingUser, { approved_at: "2026-07-05T00:00:00Z" })).toBe(
      true,
    );
  });
});

describe("canEditClientProfile", () => {
  const onboardingUser = { role: role("AREA_LEADER"), area: area(2, "ONBOARDING", "Onboarding") };
  const salesUser = { role: role("SALES_REP"), area: null };

  it("onboarding puede editar clientes aprobados", () => {
    expect(canEditClientProfile(onboardingUser, { status: "EN_CARGA_DATOS" }, true)).toBe(true);
  });

  it("vendedor solo edita pendiente o rechazado", () => {
    expect(canEditClientProfile(salesUser, { status: "EN_CARGA_DATOS" }, true)).toBe(false);
    expect(canEditClientProfile(salesUser, { status: "PENDIENTE_DE_REVISION" }, true)).toBe(true);
  });
});
