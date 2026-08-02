import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";

/** Invalida listados de prospectos tras conversión, pago, etc. */
export async function invalidateProspectsQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all });
}
