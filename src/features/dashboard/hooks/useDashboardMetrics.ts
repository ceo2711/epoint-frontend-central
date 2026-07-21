"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchDashboardMetrics } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";

export function useDashboardMetrics(
  token: string | null,
  enabled: boolean,
  merchantId: number | null,
  roleCode: string | null,
  sedeId?: number | null,
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboard.metrics(merchantId, roleCode, sedeId),
    queryFn: () => fetchDashboardMetrics(token!, { sedeId }),
    enabled: !!token && enabled && merchantId != null && !!roleCode,
  });

  return {
    metrics: data ?? null,
    loading: isLoading,
    error: isError,
    reload: refetch,
  };
}
