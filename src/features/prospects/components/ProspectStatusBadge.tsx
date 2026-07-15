"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import type { ProspectStatus } from "@/features/prospects/types";

const STATUS_STYLES: Record<ProspectStatus, string> = {
  LEAD_CALIFICADO: "bg-emerald-100 text-emerald-800",
  LEAD_NO_CALIFICADO: "bg-slate-100 text-slate-700",
  PENDIENTE_CONTACTAR: "bg-amber-100 text-amber-800",
  LEAD_CONTACTADO: "bg-blue-100 text-blue-800",
  LEAD_CERRADO: "bg-rose-100 text-rose-800",
  CONTRATO_ENVIADO: "bg-indigo-100 text-indigo-800",
  PAGO_COMPLETADO: "bg-teal-100 text-teal-800",
};

export function ProspectStatusBadge({ status }: { status: ProspectStatus }) {
  const { t } = useTranslation();
  const label = t(`prospects.status.${status}` as never);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {label}
    </span>
  );
}
