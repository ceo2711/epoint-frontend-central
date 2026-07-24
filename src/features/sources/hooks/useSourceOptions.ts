"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSourceOptions } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type { SourceBrief } from "@/features/sources/types";

export function useSourceOptions(token: string | null, enabled = true) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.sources.options,
    queryFn: () => fetchSourceOptions(token!),
    enabled: !!token && enabled,
  });

  return {
    options: (data ?? []) as SourceBrief[],
    loading: isLoading,
    error: isError,
  };
}
