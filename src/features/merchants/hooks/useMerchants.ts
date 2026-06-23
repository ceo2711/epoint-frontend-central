"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Merchant } from "@/features/merchants/types";

export function useMerchants(
  token: string | null,
  canRead: boolean,
  loadErrorMessage: string,
  noPermissionMessage: string,
  includeInactive = false,
) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMerchants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = includeInactive ? "?include_inactive=true" : "";
      const data = await api.get<Merchant[]>(`/merchants${query}`, token);
      setMerchants(data);
      setError("");
    } catch {
      setError(loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, loadErrorMessage, includeInactive]);

  useEffect(() => {
    if (canRead) void loadMerchants();
    else {
      setLoading(false);
      setError(noPermissionMessage);
    }
  }, [canRead, loadMerchants, noPermissionMessage]);

  return { merchants, loading, error, reload: loadMerchants };
}
