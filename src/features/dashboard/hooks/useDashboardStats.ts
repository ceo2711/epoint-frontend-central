"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchClientStats } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";

export function useDashboardStats(token: string | null, enabled: boolean) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.clients.stats,
    queryFn: () => fetchClientStats(token!),
    enabled: !!token && enabled,
  });

  return {
    stats: data ?? null,
    loading: isLoading,
    error: isError,
    reload: refetch,
  };
}
