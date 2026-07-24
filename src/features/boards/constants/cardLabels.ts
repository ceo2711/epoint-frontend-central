export const BOARD_CARD_LABELS = [
  "URGENTE",
  "RECHAZADA",
  "DENEGADA",
  "APROBADA",
  "PENDIENTE",
] as const;

export type BoardCardLabel = (typeof BOARD_CARD_LABELS)[number];

export const DEFAULT_BOARD_CARD_LABEL: BoardCardLabel = "PENDIENTE";

export function isBoardCardLabel(value: string | null | undefined): value is BoardCardLabel {
  return !!value && (BOARD_CARD_LABELS as readonly string[]).includes(value);
}

export function resolveCardLabel(label: string | null | undefined): BoardCardLabel {
  return isBoardCardLabel(label) ? label : DEFAULT_BOARD_CARD_LABEL;
}

/** Clase de superficie para la card del kanban (borde + fondo). */
export function kanbanCardLabelClass(label: string | null | undefined): string {
  switch (resolveCardLabel(label)) {
    case "URGENTE":
      return "kanban-card--urgente";
    case "RECHAZADA":
      return "kanban-card--rechazada";
    case "DENEGADA":
      return "kanban-card--denegada";
    case "APROBADA":
      return "kanban-card--aprobada";
    case "PENDIENTE":
      return "kanban-card--pendiente";
  }
}

/** Clases de tema para el modal completo según el label. */
export function cardModalThemeClass(label: string | null | undefined): string {
  switch (resolveCardLabel(label)) {
    case "URGENTE":
      return "card-modal-theme--urgente";
    case "RECHAZADA":
      return "card-modal-theme--rechazada";
    case "DENEGADA":
      return "card-modal-theme--denegada";
    case "APROBADA":
      return "card-modal-theme--aprobada";
    case "PENDIENTE":
      return "card-modal-theme--pendiente";
  }
}

export function cardLabelBadgeClass(label: BoardCardLabel): string {
  switch (label) {
    case "URGENTE":
      return "bg-red-600 text-white ring-red-700/30";
    case "RECHAZADA":
      return "bg-amber-500 text-white ring-amber-700/30";
    case "DENEGADA":
      return "bg-rose-600 text-white ring-rose-800/30";
    case "APROBADA":
      return "bg-emerald-600 text-white ring-emerald-800/30";
    case "PENDIENTE":
      return "bg-slate-500 text-white ring-slate-700/30";
  }
}

export function cardLabelSwatchClass(label: BoardCardLabel): string {
  switch (label) {
    case "URGENTE":
      return "bg-red-500";
    case "RECHAZADA":
      return "bg-amber-500";
    case "DENEGADA":
      return "bg-rose-600";
    case "APROBADA":
      return "bg-emerald-500";
    case "PENDIENTE":
      return "bg-slate-500";
  }
}
