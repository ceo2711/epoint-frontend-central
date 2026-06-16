"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Board } from "@/features/boards/types";

export function useBoard(token: string | null, clientId: number | null | undefined, unavailableMessage: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !clientId) return;
    setLoading(true);
    try {
      const data = await api.get<Board>(`/boards/client/${clientId}`, token);
      setBoard(data);
      setError("");
    } catch {
      setBoard(null);
      setError(unavailableMessage);
    } finally {
      setLoading(false);
    }
  }, [token, clientId, unavailableMessage]);

  useEffect(() => {
    if (!token || !clientId) return;
    void load();
  }, [load, token, clientId]);

  return { board, error, loading, load, setError };
}
