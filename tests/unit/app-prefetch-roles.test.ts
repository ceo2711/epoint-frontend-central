import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async (path: string) => {
      if (path.startsWith("/payments/config")) return { providers: [] };
      return { items: [], total: 0, page: 1, page_size: 10, pages: 1 };
    }),
    post: vi.fn(async () => ({})),
  },
}));

vi.mock("@/lib/queryFetchers", () => ({
  fetchAreas: vi.fn(async () => []),
  fetchCalendlyConnection: vi.fn(async () => ({ connected: true })),
  fetchCalendlyEvents: vi.fn(async () => [{ id: 1 }]),
  fetchCalendlyEventTypes: vi.fn(async () => [{ id: "et" }]),
  fetchCalendlySalesReps: vi.fn(async () => [{ id: 7, first_name: "Ana" }]),
  fetchClientBoard: vi.fn(async () => ({ columns: [] })),
  fetchDashboardMetrics: vi.fn(async () => ({ areas: [] })),
  fetchClientsList: vi.fn(async () => ({
    items: [{ id: 1 }],
    total: 1,
    page: 1,
    page_size: 10,
    pages: 1,
  })),
  fetchDocusignConnection: vi.fn(async () => ({ connected: true })),
  fetchDocusignEnvelopes: vi.fn(async () => []),
  fetchDocusignTemplates: vi.fn(async () => []),
  fetchInfluencers: vi.fn(async () => []),
  fetchMerchantOptions: vi.fn(async () => []),
  fetchMerchants: vi.fn(async () => []),
  fetchPortalDocuments: vi.fn(async () => []),
  fetchPortalMe: vi.fn(async () => ({ id: 1, client_id: 9 })),
  fetchProspectsList: vi.fn(async () => ({
    items: [{ id: 5 }],
    total: 1,
    page: 1,
    page_size: 10,
    pages: 1,
  })),
  fetchRoles: vi.fn(async () => []),
  fetchSedes: vi.fn(async () => [{ id: 1, name: "Sede 1" }]),
  fetchSources: vi.fn(async () => []),
  fetchSubSellerMetrics: vi.fn(async () => ({ members: [] })),
  fetchUsers: vi.fn(async () => ({ items: [] })),
  syncCalendlyEvents: vi.fn(async () => ({})),
}));

const { prefetchAppData } = await import("@/lib/appPrefetch");
const { queryKeys } = await import("@/lib/queryKeys");
const { defaultClientsListParams, resolveActiveMerchantId } = await import(
  "@/lib/listDefaults"
);
const fetchers = await import("@/lib/queryFetchers");
const { resetCalendlySyncRegistry } = await import(
  "@/features/calendly/utils/syncRegistry"
);

type Perm = string;

function baseUser(overrides: Record<string, unknown>) {
  return {
    id: 1,
    email: "u@example.com",
    first_name: "U",
    last_name: "Uno",
    is_active: true,
    is_sub_seller: false,
    merchants: [{ id: 3, name: "Epoint" }],
    active_merchant_id: 3,
    ...overrides,
  } as never;
}

function perms(...codes: Perm[]) {
  return (permission: string) => codes.includes(permission);
}

describe("prefetchAppData por rol", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    resetCalendlySyncRegistry();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("ADMIN: prefetchea shell de sedes+reps y admin pages, sin lists ni metrics", async () => {
    const user = baseUser({
      id: 1,
      role: { id: 1, code: "ADMIN", name: "Admin", permissions: [] },
    });
    await prefetchAppData(
      queryClient,
      "tok",
      user,
      perms(
        "clients:read",
        "prospects:read",
        "prospects:create",
        "users:read",
        "roles:read",
        "areas:read",
        "sedes:read",
        "merchants:read",
        "sources:read",
      ),
    );

    expect(queryClient.getQueryData(queryKeys.sedes.list(false))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.calendly.salesReps)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.sedes.list(true))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.merchants.list(true))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.sources.list(true))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.users.list())).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.roles.list)).toBeDefined();

    // ADMIN aún no eligió sede: no hay metrics ni listas ni calendly events.
    expect(
      queryClient.getQueryData(queryKeys.dashboard.metrics(3, "ADMIN")),
    ).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.calendly.events(7))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.payments.links(1, 10))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.docusign.templates)).toBeUndefined();
    expect(fetchers.syncCalendlyEvents).not.toHaveBeenCalled();
  });

  it("BRANCH_MANAGER: clientes onboarding + shell de reps + metrics", async () => {
    const user = baseUser({
      id: 20,
      role: { id: 3, code: "BRANCH_MANAGER", name: "Gerente", permissions: [] },
    });
    await prefetchAppData(
      queryClient,
      "tok",
      user,
      perms("clients:read", "clients:create", "prospects:read", "prospects:create"),
    );

    const params = defaultClientsListParams(user, 10);
    expect(params.onboardingOnly).toBe(true);
    expect(
      queryClient.getQueryData(
        queryKeys.clients.list(
          params.onboardingOnly,
          params.page,
          params.pageSize,
          params.search,
          params.merchantFilter,
          params.salesRepId,
          params.sedeId,
        ),
      ),
    ).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.calendly.salesReps)).toBeDefined();
    expect(
      queryClient.getQueryData(
        queryKeys.dashboard.metrics(resolveActiveMerchantId(user), "BRANCH_MANAGER"),
      ),
    ).toBeDefined();
    // No pide sedes (no es ADMIN).
    expect(fetchers.fetchSedes).not.toHaveBeenCalled();
    // No prefetchea links de pagos ni calendly del primer rep.
    expect(queryClient.getQueryData(queryKeys.payments.links(1, 10))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.calendly.events(7))).toBeUndefined();
  });

  it("AREA_LEADER VENTAS: influencers + /usuarios como métricas de equipo", async () => {
    const user = baseUser({
      id: 30,
      role: { id: 4, code: "AREA_LEADER", name: "Líder", permissions: [] },
      area: { id: 1, code: "VENTAS", name: "Ventas" },
    });
    await prefetchAppData(
      queryClient,
      "tok",
      user,
      perms("clients:read", "prospects:read", "users:read"),
    );

    expect(queryClient.getQueryData(queryKeys.influencers.list(true))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.calendly.salesReps)).toBeDefined();
    expect(
      queryClient.getQueryData(
        queryKeys.dashboard.metrics(resolveActiveMerchantId(user), "AREA_LEADER", null, null),
      ),
    ).toBeDefined();
    // No usa el listado de usuarios.
    expect(queryClient.getQueryData(queryKeys.users.list())).toBeUndefined();
  });

  it("AREA_LEADER ONBOARDING: clientes onboarding + reps, sin ventas", async () => {
    const user = baseUser({
      id: 31,
      role: { id: 4, code: "AREA_LEADER", name: "Líder", permissions: [] },
      area: { id: 2, code: "ONBOARDING", name: "Onboarding" },
    });
    await prefetchAppData(queryClient, "tok", user, perms("clients:read", "clients:create"));

    const params = defaultClientsListParams(user, 10);
    expect(params.onboardingOnly).toBe(true);
    expect(
      queryClient.getQueryData(
        queryKeys.clients.list(
          params.onboardingOnly,
          params.page,
          params.pageSize,
          params.search,
          params.merchantFilter,
          params.salesRepId,
          params.sedeId,
        ),
      ),
    ).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.calendly.salesReps)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.influencers.list(true))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.calendly.events(31))).toBeUndefined();
  });

  it("AREA_LEADER onboarding: lista de clientes onboarding + dashboard", async () => {
    const user = baseUser({
      id: 40,
      role: {
        id: 5,
        code: "AREA_LEADER",
        name: "Líder de área",
        permissions: [],
      },
      area: { id: 2, code: "ONBOARDING", name: "Onboarding" },
    });
    await prefetchAppData(queryClient, "tok", user, perms("clients:read", "clients:create"));

    const params = defaultClientsListParams(user, 10);
    expect(params.onboardingOnly).toBe(true);
    expect(
      queryClient.getQueryData(
        queryKeys.clients.list(
          params.onboardingOnly,
          params.page,
          params.pageSize,
          params.search,
          params.merchantFilter,
          params.salesRepId,
          params.sedeId,
        ),
      ),
    ).toBeDefined();
    expect(
      queryClient.getQueryData(
        queryKeys.dashboard.metrics(resolveActiveMerchantId(user), "AREA_LEADER"),
      ),
    ).toBeDefined();
  });

  it("sub-seller: mismo prefetch de vendedor sin /equipo", async () => {
    const user = baseUser({
      id: 100,
      is_sub_seller: true,
      role: { id: 2, code: "SALES_REP", name: "Vendedor", permissions: [] },
    });
    await prefetchAppData(
      queryClient,
      "tok",
      user,
      perms(
        "clients:read",
        "clients:create",
        "prospects:read",
        "prospects:create",
      ),
    );

    expect(queryClient.getQueryData(queryKeys.payments.config)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.calendly.events(100))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.subSellers.metrics(100))).toBeUndefined();
  });

  it("CLIENT: portal me + documentos + tablero", async () => {
    const user = baseUser({
      id: 50,
      client_id: 9,
      role: { id: 9, code: "CLIENT", name: "Cliente", permissions: [] },
      merchants: [],
      active_merchant_id: null,
    });
    await prefetchAppData(queryClient, "tok", user, () => false);

    expect(queryClient.getQueryData(queryKeys.portal.me)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.portal.documents)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.boards.client(9))).toBeDefined();
  });
});
