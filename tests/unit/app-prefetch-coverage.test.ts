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
  fetchPortalMe: vi.fn(async () => ({ id: 1 })),
  fetchProspectsList: vi.fn(async () => ({
    items: [{ id: 5 }],
    total: 1,
    page: 1,
    page_size: 10,
    pages: 1,
  })),
  fetchRoles: vi.fn(async () => []),
  fetchSedes: vi.fn(async () => []),
  fetchSources: vi.fn(async () => []),
  fetchSubSellerMetrics: vi.fn(async () => ({ members: [] })),
  fetchUsers: vi.fn(async () => ({ items: [] })),
  syncCalendlyEvents: vi.fn(async () => ({})),
}));

const { prefetchAppData } = await import("@/lib/appPrefetch");
const { queryKeys } = await import("@/lib/queryKeys");
const { defaultClientsListParams, defaultProspectsListParams } = await import(
  "@/lib/listDefaults"
);
const fetchers = await import("@/lib/queryFetchers");
const { resetCalendlySyncRegistry } = await import(
  "@/features/calendly/utils/syncRegistry"
);

const SALES_REP_PERMISSIONS = [
  "clients:read",
  "clients:create",
  "clients:update",
  "prospects:read",
  "prospects:create",
];

function salesRep() {
  return {
    id: 100,
    email: "rep@example.com",
    first_name: "Rep",
    last_name: "Uno",
    is_active: true,
    is_sub_seller: false,
    role: { id: 2, code: "SALES_REP", name: "Vendedor", permissions: [] },
    merchants: [{ id: 3, name: "Epoint" }],
    active_merchant_id: 3,
  } as never;
}

const hasPermission = (permission: string) => SALES_REP_PERMISSIONS.includes(permission);

describe("prefetchAppData para SALES_REP", () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    window.localStorage.clear();
    resetCalendlySyncRegistry();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await prefetchAppData(queryClient, "tok", salesRep(), hasPermission);
  });

  it("deja la lista de clientes en cache con la key que usa la vista", () => {
    const params = defaultClientsListParams(salesRep(), 10);
    const cached = queryClient.getQueryData(
      queryKeys.clients.list(
        params.onboardingOnly,
        params.page,
        params.pageSize,
        params.search,
        params.merchantFilter,
        params.salesRepId,
        params.sedeId,
      ),
    );
    expect(cached).toBeDefined();
  });

  it("deja la lista de prospectos en cache", () => {
    const params = defaultProspectsListParams(salesRep(), 10);
    const cached = queryClient.getQueryData(
      queryKeys.prospects.list(
        params.page,
        params.pageSize,
        params.search,
        params.statusFilter,
        params.salesRepId,
        params.sedeId,
        params.allMerchants,
      ),
    );
    expect(cached).toBeDefined();
  });

  it("sincroniza y deja eventos de Calendly en cache", () => {
    expect(fetchers.syncCalendlyEvents).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(queryKeys.calendly.events(100))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.calendly.eventTypes(100))).toBeDefined();
  });

  it("llena la cache de eventos antes de lanzar el sync remoto", () => {
    const eventsCall = (fetchers.fetchCalendlyEvents as ReturnType<typeof vi.fn>).mock
      .invocationCallOrder[0];
    const syncCall = (fetchers.syncCalendlyEvents as ReturnType<typeof vi.fn>).mock
      .invocationCallOrder[0];
    expect(eventsCall).toBeLessThan(syncCall);
  });

  it("un segundo prefetch en la misma ventana no repite el sync", async () => {
    await prefetchAppData(queryClient, "tok", salesRep(), hasPermission);
    expect(fetchers.syncCalendlyEvents).toHaveBeenCalledTimes(1);
  });

  it("deja contratos, pagos, equipo y dashboard en cache", () => {
    expect(queryClient.getQueryData(queryKeys.docusign.templates)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.payments.config)).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.payments.links(1, 10))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.subSellers.metrics(100))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.dashboard.metrics(3, "SALES_REP"))).toBeDefined();
  });
});
