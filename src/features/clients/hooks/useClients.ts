"use client";

import { useCallback, useEffect, useState } from "react";

import { api, isUnauthorizedError } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT } from "@/lib/clientEvents";
import type { Client, Paginated } from "@/features/clients/types";

export function useClients(
  token: string | null,
  authLoading: boolean,
  options?: { onboardingOnly?: boolean },
) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const onboardingOnly = options?.onboardingOnly ?? false;

  const load = useCallback(async (loadOptions?: { bustCache?: boolean }) => {
    if (authLoading || !token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (onboardingOnly) params.set("onboarding_only", "true");
      if (loadOptions?.bustCache) params.set("_", String(Date.now()));
      const query = params.toString();
      const data = await api.get<Paginated<Client>>(`/clients${query ? `?${query}` : ""}`, token);
      setClients(data.items);
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, token, onboardingOnly]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  useEffect(() => {
    const handleRefresh = () => {
      void load({ bustCache: true }).catch(() => {});
    };
    window.addEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
  }, [load]);

  return { clients, loading, load };
}
