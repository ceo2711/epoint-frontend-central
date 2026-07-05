"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRoles } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { Role } from "@/features/roles/types";

export function useRoles(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.roles.list,
    queryFn: () => fetchRoles(token!),
    enabled: !!token && canRead,
  });

  return {
    roles: (data ?? []) as Role[],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
  };
}
