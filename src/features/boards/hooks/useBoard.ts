"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Board } from "@/features/boards/types";

export function useBoard(token: string | null, clientId: number | null | undefined, unavailableMessage: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!token || !clientId) return;
    api
      .get<Board>(`/boards/client/${clientId}`, token)
      .then(setBoard)
      .catch(() => setError(unavailableMessage));
  }, [token, clientId, unavailableMessage]);

  useEffect(() => {
    load();
  }, [load]);

  return { board, error, load, setError };
}
