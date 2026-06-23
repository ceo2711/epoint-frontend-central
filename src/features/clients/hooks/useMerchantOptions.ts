"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { MerchantBrief } from "@/types/api";

export function useMerchantOptions(token: string | null, enabled: boolean) {
  const [merchants, setMerchants] = useState<MerchantBrief[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !enabled) return;
    setLoading(true);
    try {
      const data = await api.get<MerchantBrief[]>("/merchants/options", token);
      setMerchants(data);
    } catch {
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }, [token, enabled]);

  useEffect(() => {
    if (enabled) void load();
    else setMerchants([]);
  }, [enabled, load]);

  return { merchants, loading, reload: load };
}
