"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMerchantOptions } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";

export function useMerchantOptions(token: string | null, enabled: boolean) {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: queryKeys.merchants.options,
    queryFn: () => fetchMerchantOptions(token!),
    enabled: !!token && enabled,
    // Solo comercios activos: no cachear largo (admin puede desactivar en otra sesión).
    staleTime: 0,
    refetchOnMount: "always",
  });

  return {
    merchants: data ?? [],
    loading: isLoading || (enabled && isFetching && !data),
    reload: refetch,
  };
}
