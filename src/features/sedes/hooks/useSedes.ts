"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchSedes } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { Sede } from "@/features/sedes/types";

export function useSedes(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
  includeInactive = false,
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.sedes.list(includeInactive),
    queryFn: () => fetchSedes(token!, includeInactive),
    enabled: !!token && canRead,
  });

  return {
    sedes: (data ?? []) as Sede[],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
    reload: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sedes.list(includeInactive) });
      await refetch();
    },
  };
}
