/** Rutas de clientes con sede preservada (admin multi-sede). */

export function parseSedeIdParam(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function clientsListPath(sedeId?: number | null): string {
  if (sedeId == null) return "/clientes";
  return `/clientes?sede=${sedeId}`;
}

export function clientDetailPath(clientId: number, sedeId?: number | null): string {
  if (sedeId == null) return `/clientes/${clientId}`;
  return `/clientes/${clientId}?sede=${sedeId}`;
}
