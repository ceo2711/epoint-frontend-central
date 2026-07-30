"use client";

import { useQuery } from "@tanstack/react-query";

import type { CalendlySalesRep } from "@/features/calendly/types";
import { fetchCalendlySalesReps } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Lista de vendedores compartida entre vistas de supervisión y el prefetch
 * post-login (`queryKeys.calendly.salesReps`).
 */
export function useSalesReps(token: string | null, enabled = true) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.calendly.salesReps,
    queryFn: () => fetchCalendlySalesReps(token!),
    enabled: !!token && enabled,
  });

  return {
    salesReps: (data ?? []) as CalendlySalesRep[],
    loading: !!token && enabled && isLoading,
    fetching: isFetching,
    error: isError,
    reload: refetch,
  };
}
