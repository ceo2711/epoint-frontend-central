const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_MDY = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

export const DATE_INPUT_PLACEHOLDER = "MM/DD/YYYY";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseDisplayDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnly = DATE_ONLY.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    return new Date(year, month - 1, day);
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isValidYmd(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Valor de input: 08/29/2026 (vacío si no hay fecha). */
export function formatDateInput(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "";
  const formatted = formatDate(value);
  return formatted === "—" ? "" : formatted;
}

/** Enmascara dígitos como MM/DD/YYYY mientras se escribe. */
export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parsea MM/DD/YYYY o YYYY-MM-DD a ISO. Si el mes es > 12, intenta DD/MM. */
export function parseDateInputToIso(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const iso = DATE_ONLY.exec(trimmed);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return isValidYmd(year, month, day) ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
  }

  const mdy = DATE_MDY.exec(trimmed);
  if (!mdy) return null;

  let month = Number(mdy[1]);
  let day = Number(mdy[2]);
  const year = Number(mdy[3]);
  if (month > 12 && day <= 12) {
    [month, day] = [day, month];
  }
  if (!isValidYmd(year, month, day)) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Fecha absoluta: 08/29/2026 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = parseDisplayDate(value);
  if (!date) return "—";
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

/** Eje de gráficos: 08/29 */
export function formatShortDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = parseDisplayDate(value);
  if (!date) return "—";
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

/** Encabezado de mes: 08/2026 */
export function formatMonthYear(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = parseDisplayDate(value);
  if (!date) return "—";
  return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatTime(date: Date): string {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const suffix = hours24 < 12 ? "AM" : "PM";
  return `${hours12}:${pad(date.getMinutes())} ${suffix}`;
}

/** Fecha y hora absolutas: 08/29/2026 10:41 PM */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string" && DATE_ONLY.test(value.trim())) {
    return formatDate(value);
  }
  const date = parseDisplayDate(value);
  if (!date) return "—";
  return `${formatDate(date)} ${formatTime(date)}`;
}

/** Rango horario del mismo día: 08/29/2026 · 10:00 AM – 11:00 AM */
export function formatDateTimeRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): string {
  const startDate = start == null || start === "" ? null : parseDisplayDate(start);
  const endDate = end == null || end === "" ? null : parseDisplayDate(end);
  if (!startDate) return "—";
  if (!endDate) return formatDateTime(startDate);
  return `${formatDate(startDate)} · ${formatTime(startDate)} – ${formatTime(endDate)}`;
}

/** Notificaciones: relativo reciente, si no MM/DD/YYYY. */
export function formatRelativeDateTime(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  const date = parseDisplayDate(value);
  if (!date) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin >= 0 && diffMin < 1) {
    return locale === "en" ? "Just now" : "Hace un momento";
  }
  if (diffMin >= 1 && diffMin < 60) {
    return locale === "en" ? `${diffMin} min ago` : `Hace ${diffMin} min`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return locale === "en" ? `${diffHours} h ago` : `Hace ${diffHours} h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return locale === "en" ? `${diffDays} d ago` : `Hace ${diffDays} d`;
  }

  return formatDateTime(date);
}
