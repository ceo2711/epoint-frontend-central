"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  PaymentConfig,
  PaymentLink,
  PaymentLinkCreatePayload,
  PaymentRegisterClientPayload,
} from "@/features/payments/types";
import { ApiError, api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function usePayments(token: string | null) {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: queryKeys.payments.config,
    queryFn: () => api.get<PaymentConfig>("/payments/config", token!),
    enabled: !!token,
  });

  const linksQuery = useQuery({
    queryKey: queryKeys.payments.links,
    queryFn: () => api.get<PaymentLink[]>("/payments/links", token!),
    enabled: !!token,
  });

  const createLinkMutation = useMutation({
    mutationFn: (payload: PaymentLinkCreatePayload) =>
      api.post<{ link: PaymentLink; message: string }>("/payments/links", payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  const cancelLinkMutation = useMutation({
    mutationFn: (linkId: number) =>
      api.post<PaymentLink>(`/payments/links/${linkId}/cancel`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
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

  return {
    config: configQuery.data,
    links: linksQuery.data ?? [],
    loading: configQuery.isLoading || linksQuery.isLoading,
    error: (configQuery.error ?? linksQuery.error) as ApiError | null,
    createLink: createLinkMutation.mutateAsync,
    cancelLink: cancelLinkMutation.mutateAsync,
    registerClient: registerClientMutation.mutateAsync,
    isCreating: createLinkMutation.isPending,
    refetchLinks: linksQuery.refetch,
  };
}

export async function fetchPublicPayment(token: string): Promise<import("@/features/payments/types").PublicPaymentLink> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const res = await fetch(`${base}/payments/public/${token}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "Link no encontrado");
  }
  return res.json();
}

export async function completePublicPaymentStub(token: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const res = await fetch(`${base}/payments/public/${token}/complete`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "No se pudo completar el pago");
  }
  return res.json();
}
