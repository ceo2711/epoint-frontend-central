import type { CalendlyEventType } from "@/features/calendly/types";

const EVENT_TYPES_CACHE_PREFIX = "calendly-event-types";
const EVENT_TYPES_CACHE_VERSION = 3;

export const EVENTS_AUTO_SYNC_MS = 90_000;
export const EVENT_TYPES_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface EventTypesCacheEntry {
  version: number;
  fetchedAt: number;
  types: CalendlyEventType[];
}

function cacheKey(userId: number | null) {
  return `${EVENT_TYPES_CACHE_PREFIX}:${userId ?? "self"}`;
}

export function readEventTypesCache(userId: number | null): EventTypesCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventTypesCacheEntry;
    if (
      parsed.version !== EVENT_TYPES_CACHE_VERSION ||
      !Array.isArray(parsed.types) ||
      typeof parsed.fetchedAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeEventTypesCache(userId: number | null, types: CalendlyEventType[]) {
  if (typeof window === "undefined") return;
  const entry: EventTypesCacheEntry = {
    version: EVENT_TYPES_CACHE_VERSION,
    fetchedAt: Date.now(),
    types,
  };
  localStorage.setItem(cacheKey(userId), JSON.stringify(entry));
}

export function clearEventTypesCache(userId: number | null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(cacheKey(userId));
}

export function isEventTypesCacheStale(userId: number | null) {
  const cached = readEventTypesCache(userId);
  if (!cached) return true;
  return Date.now() - cached.fetchedAt >= EVENT_TYPES_TTL_MS;
}
