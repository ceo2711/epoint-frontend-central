export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Rango del día en hora local, con inicio no anterior a ahora (requerido por Calendly). */
export function getAvailableTimesRange(dateValue: string): { start: string; end: string } | null {
  const dayStart = new Date(`${dateValue}T00:00:00`);
  const dayEnd = new Date(`${dateValue}T23:59:59.999`);
  const now = new Date();
  const effectiveStart = dayStart > now ? dayStart : now;

  if (effectiveStart >= dayEnd) {
    return null;
  }

  return {
    start: effectiveStart.toISOString(),
    end: dayEnd.toISOString(),
  };
}

export function clampDateInputValue(date: Date) {
  const today = toDateInputValue(new Date());
  const candidate = toDateInputValue(date);
  return candidate < today ? today : candidate;
}
