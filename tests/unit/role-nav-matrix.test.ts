import { describe, expect, it } from "vitest";

/**
 * Matriz esperada de navegación por rol (Sidebar interno + portal).
 * Si cambia Sidebar.tsx, actualizar aquí.
 */

const internalNav = [
  { href: "/dashboard", permission: null },
  { href: "/clientes", permission: "clients:read" },
  { href: "/usuarios", permission: "users:read" },
  { href: "/comercios", permission: "merchants:create" },
  { href: "/roles", permission: "roles:read" },
] as const;

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
  SALES_REP: ["clients:read", "clients:create", "clients:update", "payments:read", "payments:create"],
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
  return internalNav
    .filter((item) => !item.permission || hasPermission(role, item.permission))
    .map((item) => item.href);
}

describe("role navigation matrix", () => {
  it("ADMIN ve todas las secciones internas", () => {
    expect(visibleInternalHrefs("ADMIN")).toEqual([
      "/dashboard",
      "/clientes",
      "/usuarios",
      "/comercios",
      "/roles",
    ]);
  });

  it("SALES_REP solo ve dashboard y clientes", () => {
    expect(visibleInternalHrefs("SALES_REP")).toEqual(["/dashboard", "/clientes"]);
  });

  it("ONBOARDING_MANAGER no ve usuarios ni comercios", () => {
    const hrefs = visibleInternalHrefs("ONBOARDING_MANAGER");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).not.toContain("/usuarios");
    expect(hrefs).not.toContain("/comercios");
    expect(hrefs).not.toContain("/roles");
  });

  it("ADVISOR no ve usuarios ni merchants", () => {
    const hrefs = visibleInternalHrefs("ADVISOR");
    expect(hrefs).toEqual(["/dashboard", "/clientes"]);
  });

  it("CLIENT usa rutas de portal", () => {
    expect(clientNav).toContain("/portal");
    expect(clientNav).toContain("/portal/tablero");
    expect(clientNav).not.toContain("/dashboard");
  });
});
