import { describe, expect, it } from "vitest";

import { getAccessibleNavItems } from "@/lib/appNavigation";
import type { User } from "@/types/api";

/**
 * Matriz esperada de navegación por rol (Sidebar interno + portal).
 * Usa appNavigation como fuente de verdad.
 */

const clientNav = [
  "/portal",
  "/portal/datos",
  "/portal/documentos",
  "/portal/tablero",
] as const;

type StaffRole = "ADMIN" | "AREA_LEADER" | "SALES_REP" | "ONBOARDING_MANAGER" | "ADVISOR";

const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  ADMIN: ["*"],
  AREA_LEADER: [
    "users:read",
    "clients:read",
    "clients:update",
    "documents:read",
    "documents:upload",
    "boards:read",
    "boards:manage",
  ],
  SALES_REP: [
    "clients:read",
    "clients:create",
    "clients:update",
    "payments:read",
    "payments:create",
    "prospects:read",
    "prospects:create",
    "prospects:update",
  ],
  ONBOARDING_MANAGER: [
    "clients:read",
    "clients:update",
    "clients:approve",
    "documents:read",
    "documents:upload",
    "boards:read",
    "boards:manage",
    "credentials:read",
  ],
  ADVISOR: [
    "clients:read",
    "documents:read",
    "documents:upload",
    "boards:read",
    "boards:manage",
    "credentials:read",
  ],
};

function hasPermission(role: StaffRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("*") || perms.includes(permission);
}

function visibleInternalHrefs(role: StaffRole): string[] {
  const user = { role: { code: role } } as User;
  return getAccessibleNavItems(user, (perm) => hasPermission(role, perm)).map((item) => item.href);
}

describe("role navigation matrix", () => {
  it("ADMIN ve panel, clientes, prospectos, calendario, contratos y pagos", () => {
    const hrefs = visibleInternalHrefs("ADMIN");
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/prospectos");
    expect(hrefs).toContain("/calendario");
    expect(hrefs).toContain("/contratos");
    expect(hrefs).toContain("/pagos");
  });

  it("SALES_REP ve dashboard, clientes y prospectos", () => {
    const hrefs = visibleInternalHrefs("SALES_REP");
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/prospectos");
    expect(hrefs).not.toContain("/usuarios");
  });

  it("ONBOARDING_MANAGER no ve usuarios ni comercios", () => {
    const hrefs = visibleInternalHrefs("ONBOARDING_MANAGER");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).not.toContain("/usuarios");
    expect(hrefs).not.toContain("/comercios");
    expect(hrefs).not.toContain("/roles");
    expect(hrefs).not.toContain("/prospectos");
  });

  it("ADVISOR no ve usuarios ni merchants", () => {
    const hrefs = visibleInternalHrefs("ADVISOR");
    expect(hrefs).toEqual(["/dashboard", "/clientes", "/configuracion"]);
  });

  it("CLIENT usa rutas de portal", () => {
    expect(clientNav).toContain("/portal");
    expect(clientNav).toContain("/portal/tablero");
    expect(clientNav).not.toContain("/dashboard");
  });
});
