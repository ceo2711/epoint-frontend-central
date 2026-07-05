"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMerchantOptions } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";

export function useMerchantOptions(token: string | null, enabled: boolean) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.merchants.options,
    queryFn: () => fetchMerchantOptions(token!),
    enabled: !!token && enabled,
    staleTime: 60_000,
  });

  return {
    merchants: data ?? [],
    loading: isLoading,
    reload: refetch,
  };
}
