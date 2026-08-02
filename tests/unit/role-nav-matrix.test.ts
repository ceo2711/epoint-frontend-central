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

type StaffRole = "ADMIN" | "AREA_LEADER" | "SALES_REP" | "ADVISOR";

const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  ADMIN: ["*"],
  AREA_LEADER: [
    "users:read",
    "clients:read",
    "clients:create",
    "clients:update",
    "prospects:read",
    "prospects:create",
    "prospects:update",
    "documents:read",
    "documents:upload",
    "boards:read",
    "boards:manage",
    "calendly:read",
    "calendly:manage",
    "payments:read",
    "payments:create",
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

function visibleInternalHrefs(role: StaffRole, areaCode?: string, extra?: Partial<User>): string[] {
  const user = {
    role: { code: role },
    area: areaCode ? { id: 1, code: areaCode, name: areaCode } : null,
    ...extra,
  } as User;
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
    expect(hrefs).toContain("/roles");
  });

  it("BRANCH_MANAGER no ve roles ni catálogos solo-admin", () => {
    const hrefs = getAccessibleNavItems(
      { role: { code: "BRANCH_MANAGER" }, area: { id: 1, code: "VENTAS", name: "Ventas" } } as User,
      (perm) => {
        if (
          perm.startsWith("sedes:") ||
          perm.startsWith("merchants:") ||
          perm.startsWith("sources:") ||
          perm.startsWith("roles:") ||
          perm === "clients:delete"
        ) {
          return false;
        }
        return true;
      },
    ).map((item) => item.href);
    expect(hrefs).toContain("/usuarios");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).not.toContain("/roles");
    expect(hrefs).not.toContain("/sedes");
    expect(hrefs).not.toContain("/comercios");
    expect(hrefs).not.toContain("/fuentes");
  });

  it("SALES_REP elegible ve dashboard, clientes, prospectos y su equipo", () => {
    const hrefs = visibleInternalHrefs("SALES_REP", undefined, {
      can_manage_sub_sellers: true,
    });
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/prospectos");
    expect(hrefs).toContain("/equipo");
    expect(hrefs).not.toContain("/usuarios");
  });

  it("SALES_REP sin elegibilidad ve Mi equipo deshabilitado", () => {
    const items = getAccessibleNavItems(
      {
        role: { code: "SALES_REP" },
        area: null,
        can_manage_sub_sellers: false,
      } as User,
      (perm) => hasPermission("SALES_REP", perm),
    );
    const equipo = items.find((item) => item.href === "/equipo");
    expect(equipo?.disabled).toBe(true);
  });

  it("subvendedor no ve la página de equipo", () => {
    const hrefs = getAccessibleNavItems(
      {
        role: { code: "SUB_SELLER" },
        area: null,
        is_sub_seller: true,
      } as User,
      (perm) => hasPermission("SALES_REP", perm),
    ).map((item) => item.href);
    expect(hrefs).not.toContain("/equipo");
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/prospectos");
    expect(hrefs).toContain("/calendario");
    expect(hrefs).toContain("/contratos");
    expect(hrefs).toContain("/pagos");
  });

  it("AREA_LEADER de ventas ve prospectos, calendario, contratos, pagos y vendedores", () => {
    const hrefs = visibleInternalHrefs("AREA_LEADER", "VENTAS");
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/prospectos");
    expect(hrefs).toContain("/calendario");
    expect(hrefs).toContain("/contratos");
    expect(hrefs).toContain("/pagos");
    expect(hrefs).toContain("/usuarios");
    expect(hrefs).not.toContain("/sedes");
    expect(hrefs).not.toContain("/comercios");

    const items = getAccessibleNavItems(
      {
        role: { code: "AREA_LEADER" },
        area: { id: 1, code: "VENTAS", name: "Ventas" },
      } as User,
      (perm) => hasPermission("AREA_LEADER", perm),
    );
    const usersItem = items.find((item) => item.href === "/usuarios");
    expect(usersItem?.labelKey).toBe("nav.salesReps");
  });

  it("AREA_LEADER sin área ventas no ve pantallas comerciales", () => {
    const hrefs = visibleInternalHrefs("AREA_LEADER", "ONBOARDING");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).not.toContain("/prospectos");
    expect(hrefs).not.toContain("/pagos");
    expect(hrefs).not.toContain("/calendario");
    expect(hrefs).not.toContain("/contratos");
  });

  it("AREA_LEADER de onboarding ve clientes y usuarios, no pantallas comerciales", () => {
    const hrefs = visibleInternalHrefs("AREA_LEADER", "ONBOARDING");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/usuarios");
    expect(hrefs).not.toContain("/comercios");
    expect(hrefs).not.toContain("/roles");
    expect(hrefs).not.toContain("/prospectos");
  });

  it("ADVISOR ve dashboard y clientes", () => {
    const hrefs = visibleInternalHrefs("ADVISOR");
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).not.toContain("/usuarios");
    expect(hrefs).not.toContain("/comercios");
  });

  it("CLIENT usa rutas de portal y oculta tablero hasta desbloquear", () => {
    const locked = getAccessibleNavItems(
      { role: { code: "CLIENT" } } as never,
      () => false,
      { boardUnlocked: false },
    ).map((item) => item.href);
    expect(locked).toContain("/portal");
    expect(locked).toContain("/portal/datos");
    expect(locked).toContain("/portal/documentos");
    expect(locked).not.toContain("/portal/tablero");
    expect(locked).not.toContain("/dashboard");

    const unlocked = getAccessibleNavItems(
      { role: { code: "CLIENT" } } as never,
      () => false,
      { boardUnlocked: true },
    ).map((item) => item.href);
    expect(unlocked).toEqual(clientNav);
  });
});
