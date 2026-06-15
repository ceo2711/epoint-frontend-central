"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Area } from "@/features/areas/types";

export function useAreas(token: string | null, canRead: boolean, loadErrorMessage: string, noPermissionMessage: string) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAreas = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get<Area[]>("/areas?include_inactive=true", token);
      setAreas(data);
    } catch {
      setError(loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, loadErrorMessage]);

  useEffect(() => {
    if (canRead) loadAreas();
    else {
      setLoading(false);
      setError(noPermissionMessage);
    }
  }, [canRead, loadAreas, noPermissionMessage]);

  return { areas, loading, error };
}
