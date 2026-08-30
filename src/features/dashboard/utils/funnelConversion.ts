import type { StatusCount } from "@/features/dashboard/types";
import type { ProspectStatus } from "@/features/prospects/types";

/** Embudo comercial feliz (sin cerrados). */
export const SALES_FUNNEL_STAGES: ProspectStatus[] = [
  "PENDIENTE_CONTACTAR",
  "LEAD_CONTACTADO",
  "CONTRATO_ENVIADO",
  "PAGO_PARCIAL",
  "PAGO_COMPLETADO",
];

export interface FunnelStageRow {
  status: ProspectStatus;
  count: number;
  reached: number;
  conversionRate: number | null;
}

export type ConversionHealth = "good" | "watch" | "critical" | "neutral";

export function getConversionHealth(rate: number | null): ConversionHealth {
  if (rate == null) return "neutral";
  if (rate >= 70) return "good";
  if (rate >= 50) return "watch";
  return "critical";
}

/** Construye tasas de avance entre etapas consecutivas usando embudo acumulado. */
export function buildFunnelStageConversion(byStatus: StatusCount[]): FunnelStageRow[] {
  const counts = new Map(byStatus.map((item) => [item.status, item.count]));
  const stageCounts = SALES_FUNNEL_STAGES.map((status) => counts.get(status) ?? 0);

  return SALES_FUNNEL_STAGES.map((status, index) => {
    const count = stageCounts[index];
    const reached = stageCounts.slice(index).reduce((sum, value) => sum + value, 0);
    const previousReached =
      index === 0 ? null : stageCounts.slice(index - 1).reduce((sum, value) => sum + value, 0);

    let conversionRate: number | null = null;
    if (index > 0 && previousReached != null && previousReached > 0) {
      conversionRate = Math.round((reached / previousReached) * 100);
    }

    return { status, count, reached, conversionRate };
  });
}
