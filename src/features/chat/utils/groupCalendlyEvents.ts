export interface ChatCalendlyEventRow {
  id: number | string;
  name?: string;
  start_label?: string;
  invitee_name?: string;
  invitee_email?: string;
  [key: string]: unknown;
}

export interface CalendlyEventsDayGroup {
  dayKey: string;
  daySort: number;
  events: ChatCalendlyEventRow[];
}

function parseDaySort(dayKey: string): number {
  const match = dayKey.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}

export function extractEventDay(startLabel: string | undefined): string {
  if (!startLabel) return "—";
  const [dayPart] = startLabel.trim().split(/\s+/);
  return dayPart || startLabel;
}

export function extractEventTime(startLabel: string | undefined): string {
  if (!startLabel) return "";
  const parts = startLabel.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

export function groupCalendlyEventsByDay(events: ChatCalendlyEventRow[]): CalendlyEventsDayGroup[] {
  const map = new Map<string, ChatCalendlyEventRow[]>();

  for (const event of events) {
    const dayKey = extractEventDay(String(event.start_label ?? ""));
    const bucket = map.get(dayKey) ?? [];
    bucket.push(event);
    map.set(dayKey, bucket);
  }

  return Array.from(map.entries())
    .map(([dayKey, dayEvents]) => ({
      dayKey,
      daySort: parseDaySort(dayKey),
      events: dayEvents,
    }))
    .sort((a, b) => a.daySort - b.daySort);
}
