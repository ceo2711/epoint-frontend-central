"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { ClientMerchantFilter } from "@/features/clients/components/ClientListFilters";
import { isUnauthorizedError } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT } from "@/lib/clientEvents";
import { fetchClientsList } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";

export const CLIENTS_PAGE_SIZE = 10;

export function useClients(
  token: string | null,
  authLoading: boolean,
  options?: {
    onboardingOnly?: boolean;
    page?: number;
    pageSize?: number;
    search?: string;
    merchantFilter?: ClientMerchantFilter;
  },
) {
  const queryClient = useQueryClient();
  const onboardingOnly = options?.onboardingOnly ?? false;
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? CLIENTS_PAGE_SIZE;
  const search = options?.search?.trim() ?? "";
  const merchantFilter = options?.merchantFilter;

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.clients.list(onboardingOnly, page, pageSize, search, merchantFilter),
    queryFn: async () =>
      fetchClientsList(token!, {
        onboardingOnly,
        page,
        pageSize,
        search,
        merchantFilter,
      }),
    enabled: !authLoading && !!token,
  });

  useEffect(() => {
    const handleRefresh = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    };
    window.addEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
  }, [queryClient]);

  const load = useCallback(
    async (loadOptions?: { bustCache?: boolean }) => {
      if (authLoading || !token) return;
      if (loadOptions?.bustCache) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.clients.list(onboardingOnly, page, pageSize, search, merchantFilter),
        });
      }
      try {
        await refetch();
      } catch (err) {
        if (!isUnauthorizedError(err)) {
          throw err;
        }
      }
    },
    [authLoading, token, queryClient, onboardingOnly, page, pageSize, search, merchantFilter, refetch],
  );

  return {
    clients: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.page_size ?? pageSize,
    pages: data?.pages ?? 1,
    loading: isLoading,
    load,
  };
}
