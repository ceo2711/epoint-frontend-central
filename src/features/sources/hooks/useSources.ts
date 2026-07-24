"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchSources } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { Source } from "@/features/sources/types";

export function useSources(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
  includeInactive = false,
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.sources.list(includeInactive),
    queryFn: () => fetchSources(token!, includeInactive),
    enabled: !!token && canRead,
  });

  return {
    sources: (data ?? []) as Source[],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
    reload: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sources.all });
      await refetch();
    },
  };
}
