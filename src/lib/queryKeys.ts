export const queryKeys = {
  dashboard: {
    metrics: (merchantId?: number | null, roleCode?: string | null) =>
      ["dashboard", "metrics", { merchantId: merchantId ?? null, roleCode: roleCode ?? null }] as const,
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
        },
      ] as const,
    detail: (id: number) => ["clients", "detail", id] as const,
    stats: ["clients", "stats"] as const,
    availability: (email: string, phone: string, excludeClientId?: number) =>
      ["clients", "availability", { email, phone, excludeClientId }] as const,
  },
  users: {
    all: ["users"] as const,
    list: ["users", "list"] as const,
  },
  merchants: {
    all: ["merchants"] as const,
    list: (includeInactive?: boolean) =>
      ["merchants", "list", { includeInactive: !!includeInactive }] as const,
    options: ["merchants", "options"] as const,
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
    links: ["payments", "links"] as const,
    linksBySalesRep: (salesRepId: number) => ["payments", "links", "salesRep", salesRepId] as const,
  },
} as const;
