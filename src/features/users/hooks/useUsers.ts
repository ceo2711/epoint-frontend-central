"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchUsers } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { User } from "@/features/users/types";

export type UsersListFilters = {
  search?: string;
  sedeId?: number | null;
};

export function useUsers(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
  filters: UsersListFilters = {},
) {
  const search = filters.search?.trim() ?? "";
  const sedeId = filters.sedeId ?? null;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.users.list({ search, sedeId }),
    queryFn: () => fetchUsers(token!, { search, sedeId }),
    enabled: !!token && canRead,
  });

  return {
    users: (data?.items ?? []) as User[],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
    reload: refetch,
  };
}
