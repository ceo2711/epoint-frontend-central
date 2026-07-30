import { beforeEach, describe, expect, it } from "vitest";

import {
  defaultClientsListParams,
  defaultProspectsListParams,
} from "@/lib/listDefaults";
import { queryKeys } from "@/lib/queryKeys";
import type { User } from "@/types/api";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 100,
    email: "rep@example.com",
    first_name: "Rep",
    last_name: "Uno",
    is_active: true,
    role: { id: 1, code: "SALES_REP", name: "Vendedor", permissions: [] },
    merchants: [{ id: 3, name: "Epoint" }],
    active_merchant_id: 3,
    ...overrides,
  } as unknown as User;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("defaultClientsListParams", () => {
  it("SALES_REP con un comercio filtra por el comercio activo", () => {
    const params = defaultClientsListParams(makeUser(), 10);
    expect(params.merchantFilter).toBe(3);
    expect(params.onboardingOnly).toBe(false);
    expect(params.enabled).toBe(true);
  });

  it("con varios comercios arranca en 'all'", () => {
    const user = makeUser({
      merchants: [
        { id: 3, name: "Epoint" },
        { id: 4, name: "Otro" },
      ],
    } as Partial<User>);
    expect(defaultClientsListParams(user, 10).merchantFilter).toBe("all");
  });

  it("ADMIN queda deshabilitado hasta elegir sede", () => {
    const user = makeUser({
      role: { id: 9, code: "ADMIN", name: "Admin", permissions: [] },
    } as Partial<User>);
    expect(defaultClientsListParams(user, 10).enabled).toBe(false);
  });

  it("la key del prefetch coincide con la que arma la vista", () => {
    const params = defaultClientsListParams(makeUser(), 10);
    const prefetchKey = queryKeys.clients.list(
      params.onboardingOnly,
      params.page,
      params.pageSize,
      params.search,
      params.merchantFilter,
      params.salesRepId,
      params.sedeId,
    );
    // Lo que hace ClientesPage al montar con su estado inicial.
    const pageKey = queryKeys.clients.list(false, 1, 10, "", 3, null, null);
    expect(prefetchKey).toEqual(pageKey);
  });
});

describe("defaultProspectsListParams", () => {
  it("SALES_REP no pide todos los comercios y arranca habilitado", () => {
    const params = defaultProspectsListParams(makeUser(), 10);
    expect(params.allMerchants).toBe(false);
    expect(params.statusFilter).toBeUndefined();
    expect(params.enabled).toBe(true);
  });

  it("la key del prefetch coincide con la que arma la vista", () => {
    const params = defaultProspectsListParams(makeUser(), 10);
    const prefetchKey = queryKeys.prospects.list(
      params.page,
      params.pageSize,
      params.search,
      params.statusFilter,
      params.salesRepId,
      params.sedeId,
      params.allMerchants,
    );
    const pageKey = queryKeys.prospects.list(1, 10, "", undefined, null, null, false);
    expect(prefetchKey).toEqual(pageKey);
  });
});
