"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { ProspectDetail } from "@/features/prospects/types";
import { api } from "@/lib/api";
import { fetchProspectsList } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";

export const PROSPECTS_PAGE_SIZE = 10;

interface UseProspectsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: string;
  salesRepId?: number | null;
  sedeId?: number | null;
  allMerchants?: boolean;
  enabled?: boolean;
}

export function useProspects(
  token: string | null,
  authLoading: boolean,
  options: UseProspectsOptions = {},
) {
  const {
    page = 1,
    pageSize = PROSPECTS_PAGE_SIZE,
    search = "",
    statusFilter,
    salesRepId,
    sedeId,
    allMerchants = false,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const queryKey = queryKeys.prospects.list(
    page,
    pageSize,
    search,
    statusFilter,
    salesRepId,
    sedeId,
    allMerchants,
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchProspectsList(token!, {
        page,
        pageSize,
        search,
        statusFilter,
        salesRepId,
        sedeId,
        allMerchants,
      }),
    enabled: !authLoading && !!token && enabled,
  });

  const load = useCallback(async () => {
    if (authLoading || !token || !enabled) return;
    await queryClient.invalidateQueries({ queryKey });
    await refetch();
  }, [authLoading, token, enabled, queryClient, queryKey, refetch]);

  return {
    prospects: data?.items ?? [],
    loading: isLoading,
    error: isError,
    load,
    total: data?.total ?? 0,
    pages: data?.pages ?? 1,
    pageSize: data?.page_size ?? pageSize,
  };
}

export interface ProspectDetailReloadOptions {
  /** Actualiza datos sin mostrar el spinner de página completa. */
  silent?: boolean;
}

function normalizeProspectDetail(data: ProspectDetail): ProspectDetail {
  return {
    ...data,
    calendly_event: data.calendly_event ?? null,
    docusign_envelope: data.docusign_envelope ?? null,
    docusign_envelopes:
      data.docusign_envelopes ??
      (data.docusign_envelope ? [data.docusign_envelope] : []),
    payment_link: data.payment_link ?? null,
    payment_links:
      data.payment_links ??
      (data.payment_link ? [data.payment_link] : []),
  };
}

export function useProspectDetail(token: string | null, prospectId: number) {
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (options?: ProspectDetailReloadOptions) => {
    if (!token || !prospectId) return;
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const data = await api.get<ProspectDetail>(`/prospects/${prospectId}`, token);
      setProspect(normalizeProspectDetail(data));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, prospectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { prospect, loading, reload: load };
}
