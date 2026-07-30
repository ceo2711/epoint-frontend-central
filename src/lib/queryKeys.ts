export const queryKeys = {
  dashboard: {
    metrics: (
      merchantId?: number | null,
      roleCode?: string | null,
      sedeId?: number | null,
      salesRepId?: number | null,
    ) =>
      [
        "dashboard",
        "metrics",
        {
          merchantId: merchantId ?? null,
          roleCode: roleCode ?? null,
          sedeId: sedeId ?? null,
          salesRepId: salesRepId ?? null,
        },
      ] as const,
  },
  clients: {
    all: ["clients"] as const,
    list: (
      onboardingOnly?: boolean,
      page?: number,
      pageSize?: number,
      search?: string,
      merchantFilter?: "all" | number,
      salesRepId?: number | null,
      sedeId?: number | null,
    ) =>
      [
        "clients",
        "list",
        {
          onboardingOnly: !!onboardingOnly,
          page: page ?? 1,
          pageSize: pageSize ?? 10,
          search: search?.trim() || "",
          merchantFilter: merchantFilter ?? "active",
          salesRepId: salesRepId ?? null,
          sedeId: sedeId ?? null,
        },
      ] as const,
    detail: (id: number) => ["clients", "detail", id] as const,
    stats: ["clients", "stats"] as const,
    availability: (email: string, phone: string, excludeClientId?: number) =>
      ["clients", "availability", { email, phone, excludeClientId }] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters?: { search?: string; sedeId?: number | null }) =>
      [
        "users",
        "list",
        {
          search: filters?.search ?? "",
          sedeId: filters?.sedeId ?? null,
        },
      ] as const,
  },
  merchants: {
    all: ["merchants"] as const,
    list: (includeInactive?: boolean) =>
      ["merchants", "list", { includeInactive: !!includeInactive }] as const,
    options: ["merchants", "options"] as const,
  },
  sources: {
    all: ["sources"] as const,
    list: (includeInactive?: boolean) =>
      ["sources", "list", { includeInactive: !!includeInactive }] as const,
    options: ["sources", "options"] as const,
  },
  influencers: {
    all: ["influencers"] as const,
    list: (includeInactive?: boolean) =>
      ["influencers", "list", { includeInactive: !!includeInactive }] as const,
    options: (sedeId?: number | null) =>
      ["influencers", "options", { sedeId: sedeId ?? null }] as const,
  },
  sedes: {
    all: ["sedes"] as const,
    list: (includeInactive?: boolean) =>
      ["sedes", "list", { includeInactive: !!includeInactive }] as const,
  },
  areas: {
    list: ["areas", "list"] as const,
  },
  roles: {
    list: ["roles", "list"] as const,
  },
  boards: {
    client: (clientId: number) => ["boards", "client", clientId] as const,
  },
  portal: {
    me: ["portal", "me"] as const,
    documents: ["portal", "documents"] as const,
  },
  calendly: {
    all: ["calendly"] as const,
    connection: (userId?: number | null) =>
      ["calendly", "connection", { userId: userId ?? null }] as const,
    events: (userId?: number | null) => ["calendly", "events", { userId: userId ?? null }] as const,
    eventTypes: (userId?: number | null) =>
      ["calendly", "eventTypes", { userId: userId ?? null }] as const,
    salesReps: ["calendly", "salesReps"] as const,
  },
  docusign: {
    all: ["docusign"] as const,
    connection: ["docusign", "connection"] as const,
    templates: ["docusign", "templates"] as const,
    envelopes: ["docusign", "envelopes"] as const,
    envelopesBySalesRep: (salesRepId: number) => ["docusign", "envelopes", "salesRep", salesRepId] as const,
    clientEnvelopes: (clientId: number) => ["docusign", "envelopes", "client", clientId] as const,
    templateDetail: (templateId: string) => ["docusign", "templates", templateId] as const,
  },
  payments: {
    all: ["payments"] as const,
    config: ["payments", "config"] as const,
    links: (page = 1, pageSize = 10) => ["payments", "links", { page, pageSize }] as const,
    linksBySalesRep: (salesRepId: number, page = 1, pageSize = 10) =>
      ["payments", "links", "salesRep", salesRepId, { page, pageSize }] as const,
  },
  prospects: {
    all: ["prospects"] as const,
    list: (
      page?: number,
      pageSize?: number,
      search?: string,
      statusFilter?: string | null,
      salesRepId?: number | null,
      sedeId?: number | null,
      allMerchants?: boolean,
    ) =>
      [
        "prospects",
        "list",
        {
          page: page ?? 1,
          pageSize: pageSize ?? 10,
          search: search?.trim() || "",
          statusFilter: statusFilter ?? null,
          salesRepId: salesRepId ?? null,
          sedeId: sedeId ?? null,
          allMerchants: !!allMerchants,
        },
      ] as const,
  },
  subSellers: {
    all: ["sub-sellers"] as const,
    metrics: (userId?: number | null) =>
      ["sub-sellers", "metrics", userId ?? null] as const,
  },
} as const;
