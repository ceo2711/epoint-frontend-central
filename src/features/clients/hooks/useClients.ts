"use client";

import { useCallback, useEffect, useState } from "react";

import { api, isUnauthorizedError } from "@/lib/api";
import type { Client, Paginated } from "@/features/clients/types";

export function useClients(token: string | null, authLoading: boolean) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (authLoading || !token) return;
    setLoading(true);
    try {
      const data = await api.get<Paginated<Client>>("/clients", token);
      setClients(data.items);
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, token]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  return { clients, loading, load };
}
