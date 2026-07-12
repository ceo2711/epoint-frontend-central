"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";
import { setActiveMerchantIdProvider } from "@/lib/api";
import type { MerchantBrief, User } from "@/types/api";

const STORAGE_KEY = "epoint_active_merchant_id";

interface MerchantContextValue {
  merchants: MerchantBrief[];
  activeMerchantId: number | null;
  activeMerchant: MerchantBrief | null;
  isStaff: boolean;
  switching: boolean;
  switchMerchant: (merchantId: number) => Promise<void>;
}

const MerchantContext = createContext<MerchantContextValue | null>(null);

function resolveInitialMerchantId(user: User): number | null {
  const merchants = user.merchants ?? [];
  if (merchants.length === 0) return null;

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (merchants.some((merchant) => merchant.id === parsed)) {
        return parsed;
      }
    }
  }

  if (user.active_merchant_id && merchants.some((m) => m.id === user.active_merchant_id)) {
    return user.active_merchant_id;
  }

  if (merchants.length === 1) {
    return merchants[0].id;
  }

  return null;
}

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const { user, token, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeMerchantId, setActiveMerchantId] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);

  const isStaff = !!user && user.role.code !== "CLIENT";
  const merchants = user?.merchants ?? [];

  useEffect(() => {
    if (!isStaff || !user) {
      setActiveMerchantId(null);
      setActiveMerchantIdProvider(() => null);
      return;
    }

    const resolved = resolveInitialMerchantId(user);
    setActiveMerchantId(resolved);
    setActiveMerchantIdProvider(() => resolved);
    if (resolved !== null) {
      window.localStorage.setItem(STORAGE_KEY, String(resolved));
    }
  }, [user, isStaff]);

  const activeMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === activeMerchantId) ?? null,
    [merchants, activeMerchantId],
  );

  const switchMerchant = useCallback(
    async (merchantId: number) => {
      if (!token || !isStaff) return;
      if (merchantId === activeMerchantId) return;

      setSwitching(true);
      try {
        await api.put("/auth/me/active-merchant", { merchant_id: merchantId }, token);
        window.localStorage.setItem(STORAGE_KEY, String(merchantId));
        setActiveMerchantId(merchantId);
        setActiveMerchantIdProvider(() => merchantId);
        await refreshUser();
        await queryClient.invalidateQueries();
      } finally {
        setSwitching(false);
      }
    },
    [token, isStaff, activeMerchantId, refreshUser, queryClient],
  );

  const value = useMemo(
    () => ({
      merchants,
      activeMerchantId,
      activeMerchant,
      isStaff,
      switching,
      switchMerchant,
    }),
    [merchants, activeMerchantId, activeMerchant, isStaff, switching, switchMerchant],
  );

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
}

export function useMerchant() {
  const ctx = useContext(MerchantContext);
  if (!ctx) throw new Error("useMerchant debe usarse dentro de MerchantProvider");
  return ctx;
}
