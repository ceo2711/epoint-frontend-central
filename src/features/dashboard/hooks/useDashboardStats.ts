"use client";

import { useCallback, useEffect, useState } from "react";

import type { ClientStats } from "@/features/dashboard/types";
import { api } from "@/lib/api";

export function useDashboardStats(token: string | null, enabled: boolean) {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!token || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await api.get<ClientStats>("/clients/stats", token);
      setStats(data);
    } catch {
      setError(true);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [token, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
