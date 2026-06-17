"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Board } from "@/features/boards/types";

export function useBoard(token: string | null, clientId: number | null | undefined, unavailableMessage: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token || !clientId) return null;
    if (!options?.silent) setLoading(true);
    try {
      const data = await api.get<Board>(`/boards/client/${clientId}`, token);
      setBoard(data);
      setError("");
      return data;
    } catch {
      if (!options?.silent) {
        setBoard(null);
      }
      setError(unavailableMessage);
      return null;
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [token, clientId, unavailableMessage]);

  const refresh = useCallback(async () => load({ silent: true }), [load]);

  useEffect(() => {
    if (!token || !clientId) return;
    void load();
  }, [load, token, clientId]);

  return { board, error, loading, load, refresh, setError };
}
