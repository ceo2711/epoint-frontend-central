import { describe, expect, it } from "vitest";

import {
  canEditClientProfile,
  canViewApprovedClientWorkspace,
  canViewClientOnboardingWorkspace,
} from "@/features/clients/client-access";

describe("canViewClientOnboardingWorkspace", () => {
  it("permite admin, onboarding y asesor", () => {
    expect(canViewClientOnboardingWorkspace({ id: 1, role: { code: "ADMIN" } })).toBe(true);
    expect(canViewClientOnboardingWorkspace({ id: 1, role: { code: "ONBOARDING_MANAGER" } })).toBe(true);
    expect(canViewClientOnboardingWorkspace({ id: 1, role: { code: "ADVISOR" } })).toBe(true);
  });

  it("niega vendedor y otros roles", () => {
    expect(canViewClientOnboardingWorkspace({ id: 1, role: { code: "SALES_REP" } })).toBe(false);
    expect(canViewClientOnboardingWorkspace({ id: 1, role: { code: "AREA_LEADER" } })).toBe(false);
    expect(canViewClientOnboardingWorkspace(null)).toBe(false);
  });
});

describe("canViewApprovedClientWorkspace", () => {
  const onboardingUser = { id: 1, role: { code: "ONBOARDING_MANAGER" as const } };

  it("requiere cliente aprobado", () => {
    expect(canViewApprovedClientWorkspace(onboardingUser, { approved_at: null })).toBe(false);
    expect(canViewApprovedClientWorkspace(onboardingUser, { approved_at: "2026-07-05T00:00:00Z" })).toBe(true);
  });
});

describe("canEditClientProfile", () => {
  const onboardingUser = { role: { code: "ONBOARDING_MANAGER" as const } };
  const salesUser = { role: { code: "SALES_REP" as const } };

  it("onboarding puede editar clientes aprobados", () => {
    expect(canEditClientProfile(onboardingUser, { status: "EN_CARGA_DATOS" }, true)).toBe(true);
  });

  it("vendedor solo edita pendiente o rechazado", () => {
    expect(canEditClientProfile(salesUser, { status: "EN_CARGA_DATOS" }, true)).toBe(false);
    expect(canEditClientProfile(salesUser, { status: "PENDIENTE_DE_REVISION" }, true)).toBe(true);
  });
});
