import type { ProspectStatus } from "@/features/prospects/types";

export const ALLOWED_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  LEAD_CALIFICADO: ["PENDIENTE_CONTACTAR", "LEAD_CONTACTADO", "LEAD_CERRADO"],
  LEAD_NO_CALIFICADO: ["LEAD_CERRADO"],
  PENDIENTE_CONTACTAR: ["LEAD_CONTACTADO", "LEAD_CERRADO"],
  LEAD_CONTACTADO: ["CONTRATO_ENVIADO", "LEAD_CERRADO"],
  CONTRATO_ENVIADO: ["PAGO_COMPLETADO", "LEAD_CERRADO"],
  PAGO_COMPLETADO: [],
  LEAD_CERRADO: [],
};

export function getAllowedNextStatuses(status: ProspectStatus): ProspectStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}
