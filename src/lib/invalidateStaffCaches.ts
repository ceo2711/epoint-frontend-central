import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";

/** Tras crear/editar/desactivar vendedores o subvendedores, refresca listados y paneles. */
export function invalidateStaffDirectoryCaches(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.calendly.salesReps }),
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.subSellers.all }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}
