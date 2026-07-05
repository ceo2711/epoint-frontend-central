"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAreas } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { Area } from "@/features/areas/types";

export function useAreas(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.areas.list,
    queryFn: () => fetchAreas(token!),
    enabled: !!token && canRead,
  });

  return {
    areas: (data ?? []) as Area[],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
  };
}
