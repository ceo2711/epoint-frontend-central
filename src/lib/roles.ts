import type { User } from "@/types/api";

/** Roles con poderes de administración de sede (gerente) o globales (admin). */

export const SALES_STAFF_ROLE_CODES = ["SALES_REP", "SUB_SELLER"] as const;

export function isSalesStaff(roleCode: string | undefined | null): boolean {
  return roleCode === "SALES_REP" || roleCode === "SUB_SELLER";
}

export function isLeadSalesRep(user: User | null | undefined): boolean {
  return user?.role.code === "SALES_REP" && !user.is_sub_seller;
}

export function isGlobalAdmin(roleCode: string | undefined | null): boolean {
  return roleCode === "ADMIN";
}

/** Admin global o gerente de sucursal: acceso completo dentro de su alcance. */
export function isSedeAdmin(roleCode: string | undefined | null): boolean {
  return roleCode === "ADMIN" || roleCode === "BRANCH_MANAGER";
}

export function canManageSedes(roleCode: string | undefined | null): boolean {
  return isGlobalAdmin(roleCode);
}

/** CRUD de comercios: solo admin global. El gerente solo los usa como workspace. */
export function canManageMerchants(roleCode: string | undefined | null): boolean {
  return isGlobalAdmin(roleCode);
}

/** CRUD de sources de prospectos/clientes: solo admin global. */
export function canManageSources(roleCode: string | undefined | null): boolean {
  return isGlobalAdmin(roleCode);
}

/** Influencers por sede: solo el jefe de área de Ventas. */
export function canManageInfluencers(user: User | null | undefined): boolean {
  return isSalesAreaLeader(user);
}

export function isSalesAreaLeader(user: User | null | undefined): boolean {
  return user?.role.code === "AREA_LEADER" && user.area?.code === "VENTAS";
}

export function isOnboardingAreaLeader(
  user: Pick<User, "role" | "area"> | null | undefined,
): boolean {
  return user?.role.code === "AREA_LEADER" && user.area?.code === "ONBOARDING";
}

export function isAdvisorsAreaLeader(
  user: Pick<User, "role" | "area"> | null | undefined,
): boolean {
  return user?.role.code === "AREA_LEADER" && user.area?.code === "ASESORES";
}

/** Admin/gerente o líder de onboarding (antes: Encargado de Onboarding). */
export function canManageOnboarding(
  user: Pick<User, "role" | "area"> | null | undefined,
): boolean {
  return isSedeAdmin(user?.role.code) || isOnboardingAreaLeader(user);
}

/** Puede ver/filtrar el trabajo de vendedores (gerente/admin o líder de ventas). */
export function canSuperviseSalesReps(user: User | null | undefined): boolean {
  return isSedeAdmin(user?.role.code) || isSalesAreaLeader(user);
}

/** Filtro por vendedor en listado de clientes (incluye líder de onboarding). */
export function canFilterClientsBySalesRep(user: User | null | undefined): boolean {
  return canSuperviseSalesReps(user) || isOnboardingAreaLeader(user);
}
