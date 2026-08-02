"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMerchants } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { Merchant } from "@/features/merchants/types";

export function useMerchants(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
  includeInactive = false,
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.merchants.list(includeInactive),
    queryFn: () => fetchMerchants(token!, includeInactive),
    enabled: !!token && canRead,
  });

  return {
    merchants: (data ?? []) as Merchant[],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
    reload: async () => {
      // Incluye `/merchants/options` (selects de prospectos/clientes) y todos los listados.
      await queryClient.invalidateQueries({ queryKey: queryKeys.merchants.all });
      await refetch();
    },
  };
}
