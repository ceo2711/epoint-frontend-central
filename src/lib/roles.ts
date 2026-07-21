/** Roles con poderes de administración de sede (gerente) o globales (admin). */

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
