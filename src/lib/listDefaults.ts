/**
 * Parámetros iniciales de los listados que dependen del rol.
 *
 * Los usan la página y `appPrefetch` para que la query key del prefetch sea
 * exactamente la que pide la vista al montar; si difieren, el prefetch se
 * descarta y el usuario vuelve a esperar la request.
 */

import type { ClientMerchantFilter } from "@/features/clients/components/ClientListFilters";
import {
  canSuperviseSalesReps,
  isAdvisor,
  isGlobalAdmin,
  seesOnboardingDashboard,
} from "@/lib/roles";
import type { User } from "@/types/api";

export const ACTIVE_MERCHANT_STORAGE_KEY = "epoint_active_merchant_id";

/** Misma resolución que `MerchantContext.resolveInitialMerchantId`. */
export function resolveActiveMerchantId(user: User): number | null {
  const merchants = user.merchants ?? [];
  if (merchants.length === 0) return null;

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(ACTIVE_MERCHANT_STORAGE_KEY);
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

export interface ClientsListParams {
  onboardingOnly: boolean;
  page: number;
  pageSize: number;
  search: string;
  merchantFilter: ClientMerchantFilter | undefined;
  salesRepId: number | null;
  sedeId: number | null;
  /** False cuando la vista espera que el usuario elija sede antes de pedir datos. */
  enabled: boolean;
}

export function defaultClientsListParams(user: User, pageSize: number): ClientsListParams {
  const roleCode = user.role.code;
  const isGlobal = isGlobalAdmin(roleCode);
  const showMerchantFilter = (user.merchants ?? []).length > 1;

  return {
    onboardingOnly:
      roleCode === "BRANCH_MANAGER" || (seesOnboardingDashboard(user) && !isAdvisor(user)),
    page: 1,
    pageSize,
    search: "",
    merchantFilter: showMerchantFilter ? "all" : resolveActiveMerchantId(user) ?? undefined,
    salesRepId: null,
    sedeId: null,
    enabled: !isGlobal,
  };
}

export interface ProspectsListParams {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: string | undefined;
  salesRepId: number | null;
  sedeId: number | null;
  allMerchants: boolean;
  enabled: boolean;
}

export function defaultProspectsListParams(user: User, pageSize: number): ProspectsListParams {
  return {
    page: 1,
    pageSize,
    search: "",
    statusFilter: undefined,
    salesRepId: null,
    sedeId: null,
    allMerchants: canSuperviseSalesReps(user),
    enabled: !isGlobalAdmin(user.role.code),
  };
}
