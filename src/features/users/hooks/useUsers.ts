"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Paginated, User } from "@/features/users/types";

export function useUsers(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.users.list,
    queryFn: () => api.get<Paginated<User>>("/users", token!),
    enabled: !!token && canRead,
  });

  return {
    users: data?.items ?? [],
    loading: canRead ? isLoading : false,
    error: canRead ? (isError ? loadErrorMessage : "") : noPermissionMessage,
    reload: refetch,
  };
}
