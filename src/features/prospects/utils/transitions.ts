import type { ProspectStatus } from "@/features/prospects/types";

export const ALLOWED_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  PENDIENTE_CONTACTAR: ["LEAD_CONTACTADO", "LEAD_CERRADO"],
  LEAD_CONTACTADO: ["PENDIENTE_CONTACTAR", "CONTRATO_ENVIADO", "LEAD_CERRADO"],
  CONTRATO_ENVIADO: ["PAGO_COMPLETADO", "LEAD_CERRADO"],
  PAGO_COMPLETADO: [],
  LEAD_CERRADO: [],
};

export function getAllowedNextStatuses(status: ProspectStatus): ProspectStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

/** Estados que el usuario puede elegir manualmente en el formulario. */
export function getManualStatusOptions(
  roleCode: string | undefined,
  status: ProspectStatus,
): ProspectStatus[] {
  const allowed = getAllowedNextStatuses(status);
  if (roleCode === "SALES_REP") {
    return allowed.filter((item) => item === "LEAD_CERRADO");
  }
  return allowed;
}
