"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type {
  PaymentConfig,
  PaymentLink,
  PaymentLinkCreatePayload,
  PaymentRegisterClientPayload,
} from "@/features/payments/types";
import { ApiError } from "@/lib/api-error";
import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-config";
import { logClientError, NETWORK_ERROR_MESSAGE } from "@/lib/user-facing-error";
import { queryKeys } from "@/lib/queryKeys";
import type { Paginated } from "@/types/api";

export const PAYMENTS_PAGE_SIZE = 10;

async function publicPaymentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, init);
  } catch (cause) {
    logClientError("payments:public", cause, { path, baseUrl: base });
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "Error en la solicitud");
  }
  return res.json() as Promise<T>;
}

type UsePaymentsOptions = {
  adminView?: boolean;
  salesRepId?: number | null;
  page?: number;
  pageSize?: number;
};

export function usePayments(token: string | null, options?: UsePaymentsOptions) {
  const queryClient = useQueryClient();
  const adminView = options?.adminView ?? false;
  const salesRepId = options?.salesRepId ?? null;
  const pageSize = options?.pageSize ?? PAYMENTS_PAGE_SIZE;
  const [page, setPage] = useState(options?.page ?? 1);

  const configQuery = useQuery({
    queryKey: queryKeys.payments.config,
    queryFn: () => api.get<PaymentConfig>("/payments/config", token!),
    enabled: !!token && !adminView,
    staleTime: 5 * 60_000,
  });

  const linksQueryKey =
    salesRepId != null
      ? queryKeys.payments.linksBySalesRep(salesRepId, page, pageSize)
      : queryKeys.payments.links(page, pageSize);

  const linksQuery = useQuery({
    queryKey: linksQueryKey,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (salesRepId != null) params.set("created_by_user_id", String(salesRepId));
      return api.get<Paginated<PaymentLink>>(`/payments/links?${params}`, token!);
    },
    enabled: !!token && (!adminView || salesRepId != null),
    staleTime: 5 * 60_000,
  });

  const createLinkMutation = useMutation({
    mutationFn: (payload: PaymentLinkCreatePayload) =>
      api.post<import("@/features/payments/types").PaymentLinkCreateResult>(
        "/payments/links",
        payload,
        token!,
      ),
    onSuccess: () => {
      setPage(1);
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  const cancelLinkMutation = useMutation({
    mutationFn: (linkId: number) =>
      api.post<PaymentLink>(`/payments/links/${linkId}/cancel`, {}, token!),
    onSuccess: (updated) => {
      queryClient.setQueriesData<Paginated<PaymentLink>>(
        { queryKey: ["payments", "links"] },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old;
          return {
            ...old,
            items: old.items.map((link) => (link.id === updated.id ? updated : link)),
          };
        },
      );
      void queryClient.invalidateQueries({
        queryKey: ["payments", "links"],
        refetchType: "none",
      });
    },
  });

  const registerClientMutation = useMutation({
    mutationFn: ({ linkId, payload }: { linkId: number; payload: PaymentRegisterClientPayload }) =>
      api.post<{ client_id: number; message: string }>(
        `/payments/links/${linkId}/register-client`,
        payload,
        token!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  const loading = adminView
    ? salesRepId != null && linksQuery.isLoading
    : configQuery.isLoading || linksQuery.isLoading;

  const data = linksQuery.data;

  return {
    config: configQuery.data,
    links: data?.items ?? [],
    page: data?.page ?? page,
    pages: data?.pages ?? 1,
    total: data?.total ?? 0,
    pageSize: data?.page_size ?? pageSize,
    setPage,
    loading,
    loadingLinks: linksQuery.isLoading,
    error: (configQuery.error ?? linksQuery.error) as ApiError | null,
    createLink: createLinkMutation.mutateAsync,
    cancelLink: cancelLinkMutation.mutateAsync,
    registerClient: registerClientMutation.mutateAsync,
    isCreating: createLinkMutation.isPending,
    refetchLinks: linksQuery.refetch,
  };
}

export async function fetchPublicPayment(token: string): Promise<import("@/features/payments/types").PublicPaymentLink> {
  return publicPaymentFetch<import("@/features/payments/types").PublicPaymentLink>(`/payments/public/${token}`);
}

export async function completePublicPaymentStub(token: string): Promise<import("@/features/payments/types").PublicPaymentLink> {
  return publicPaymentFetch<import("@/features/payments/types").PublicPaymentLink>(
    `/payments/public/${token}/complete`,
    { method: "POST" },
  );
}

export async function confirmPublicPaymentReturn(
  token: string,
  orderId?: string | null,
): Promise<import("@/features/payments/types").PublicPaymentLink> {
  const query = orderId ? `?order_id=${encodeURIComponent(orderId)}` : "";
  return publicPaymentFetch<import("@/features/payments/types").PublicPaymentLink>(
    `/payments/public/${token}/confirm-return${query}`,
    { method: "POST" },
  );
}
