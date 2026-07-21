"use client";

import { useCallback, useEffect, useState } from "react";

import type { Prospect, ProspectDetail } from "@/features/prospects/types";
import type { Paginated } from "@/types/api";
import { api } from "@/lib/api";

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
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!token || !enabled) {
      setProspects([]);
      setTotal(0);
      setPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status_filter", statusFilter);
      if (salesRepId) params.set("sales_rep_id", String(salesRepId));
      if (sedeId != null) params.set("sede_id", String(sedeId));
      if (allMerchants) params.set("all_merchants", "true");
      const data = await api.get<Paginated<Prospect>>(`/prospects?${params.toString()}`, token);
      setProspects(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError(true);
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, [token, enabled, page, pageSize, search, statusFilter, salesRepId, sedeId, allMerchants]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  return { prospects, loading, error, load, total, pages, pageSize };
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
