import { isOnboardingAreaLeader, isSedeAdmin } from "@/lib/roles";
import type { Client, User } from "@/types/api";

const SALES_REP_EDITABLE_STATUSES = ["PENDIENTE_DE_REVISION", "RECHAZADO"] as const;

/** Roles que pueden ver el workspace de onboarding (post-aprobación). */
export function canViewClientOnboardingWorkspace(
  user: Pick<User, "id" | "role" | "area"> | null | undefined,
  _client?: Pick<Client, "advisor"> | null,
): boolean {
  if (!user) return false;
  const role = user.role.code;
  if (isSedeAdmin(role) || role === "ONBOARDING_MANAGER") return true;
  if (isOnboardingAreaLeader(user)) return true;
  if (role === "ADVISOR") return true;
  return false;
}

/** Datos extendidos, documentos y tablero: solo tras aprobación del cliente. */
export function canViewApprovedClientWorkspace(
  user: Pick<User, "id" | "role" | "area"> | null | undefined,
  client: Pick<Client, "approved_at" | "advisor"> | null | undefined,
): boolean {
  return canViewClientOnboardingWorkspace(user, client) && !!client?.approved_at;
}

/** Edición de datos del cliente: onboarding/admin/líder onboarding siempre; vendedor solo pendiente/rechazado. */
export function canEditClientProfile(
  user: Pick<User, "role" | "area"> | null | undefined,
  client: Pick<Client, "status"> | null | undefined,
  hasUpdatePermission: boolean,
): boolean {
  if (!hasUpdatePermission || !client || !user) return false;
  const role = user.role.code;
  if (role === "ONBOARDING_MANAGER" || isSedeAdmin(role) || isOnboardingAreaLeader(user)) {
    return true;
  }
  return SALES_REP_EDITABLE_STATUSES.includes(
    client.status as (typeof SALES_REP_EDITABLE_STATUSES)[number],
  );
}
