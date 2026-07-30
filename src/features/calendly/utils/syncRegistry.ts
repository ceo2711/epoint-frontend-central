/**
 * Registro del último `POST /calendly/sync` por usuario.
 *
 * Vive a nivel de módulo (no en un ref del hook) para que el prefetch
 * post-login y `useCalendly` compartan la ventana: si el prefetch acaba de
 * sincronizar, abrir la vista no repite el sync ni invalida los eventos.
 */

export const CALENDLY_SYNC_MIN_INTERVAL_MS = 60_000;

const lastSyncAt = new Map<number | null, number>();

function normalize(userId?: number | null): number | null {
  return userId ?? null;
}

export function markCalendlySync(userId?: number | null, at = Date.now()): void {
  lastSyncAt.set(normalize(userId), at);
}

export function shouldSyncCalendly(
  userId?: number | null,
  now = Date.now(),
  minIntervalMs = CALENDLY_SYNC_MIN_INTERVAL_MS,
): boolean {
  const last = lastSyncAt.get(normalize(userId));
  if (last === undefined) return true;
  return now - last >= minIntervalMs;
}

export function resetCalendlySyncRegistry(): void {
  lastSyncAt.clear();
}
