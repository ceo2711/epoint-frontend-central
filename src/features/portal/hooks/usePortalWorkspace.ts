"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPortalDocuments, fetchPortalMe } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { Client, DocumentBrief } from "@/types/api";

export function usePortalMe(token: string | null) {
  return useQuery({
    queryKey: queryKeys.portal.me,
    queryFn: () => fetchPortalMe(token!),
    enabled: !!token,
  });
}

export function usePortalDocuments(token: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.portal.documents,
    queryFn: () => fetchPortalDocuments(token!),
    enabled: !!token && enabled,
  });
}

export function usePortalWorkspace(token: string | null) {
  const profileQuery = usePortalMe(token);
  const documentsQuery = usePortalDocuments(token, !!token);

  const client: Client | null =
    profileQuery.data && documentsQuery.data
      ? { ...profileQuery.data, documents: documentsQuery.data }
      : profileQuery.data ?? null;

  return {
    client,
    loading: profileQuery.isLoading || documentsQuery.isLoading,
    reloadProfile: profileQuery.refetch,
    reloadDocuments: documentsQuery.refetch,
  };
}

export type { Client, DocumentBrief };
