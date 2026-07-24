"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchInfluencerOptions } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { InfluencerBrief } from "@/features/influencers/types";

export function useInfluencerOptions(
  token: string | null,
  enabled = true,
  sedeId?: number | null,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.influencers.options(sedeId ?? null),
    queryFn: () => fetchInfluencerOptions(token!, sedeId),
    enabled: !!token && enabled,
  });

  return {
    options: (data ?? []) as InfluencerBrief[],
    loading: isLoading,
    error: isError,
  };
}
