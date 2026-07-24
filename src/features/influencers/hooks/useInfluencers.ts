"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchInfluencers } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { Influencer } from "@/features/influencers/types";

export function useInfluencers(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
  includeInactive = false,
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.influencers.list(includeInactive),
    queryFn: () => fetchInfluencers(token!, includeInactive),
    enabled: !!token && canRead,
  });

  return {
    influencers: (data ?? []) as Influencer[],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
    reload: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.influencers.all });
      await refetch();
    },
  };
}
