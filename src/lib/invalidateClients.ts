import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";

/** Invalida listados y detalle de clientes (p. ej. tras eliminar). */
export async function invalidateClientsQueries(
  queryClient: QueryClient,
  options?: { clientId?: number; clientIds?: number[] },
): Promise<void> {
  const ids = new Set<number>();
  if (options?.clientId != null) ids.add(options.clientId);
  for (const id of options?.clientIds ?? []) ids.add(id);

  for (const id of ids) {
    queryClient.removeQueries({ queryKey: queryKeys.clients.detail(id) });
  }

  await queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
  await queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
}
