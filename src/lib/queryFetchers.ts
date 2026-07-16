import type { Area } from "@/features/areas/types";
import type {
  CalendlyConnection,
  CalendlyEvent,
  CalendlyEventType,
  CalendlySalesRep,
} from "@/features/calendly/types";
import {
  isEventTypesCacheStale,
  readEventTypesCache,
  writeEventTypesCache,
} from "@/features/calendly/utils/eventTypesCache";
import type { ClientStats, DashboardMetrics } from "@/features/dashboard/types";
import type {
  DocusignConnection,
  DocusignEnvelope,
  DocusignTemplate,
} from "@/features/docusign/types";
import type { Board } from "@/features/boards/types";
import type { Merchant } from "@/features/merchants/types";
import type { Role } from "@/features/roles/types";
import type { Client, DocumentBrief, MerchantBrief, Paginated, User } from "@/types/api";
import { api } from "@/lib/api";

export function calendlyUserQuery(userId?: number | null): string {
  return userId ? `?user_id=${userId}` : "";
}

export function fetchClientStats(token: string) {
  return api.get<ClientStats>("/clients/stats", token);
}

export function fetchDashboardMetrics(token: string) {
  return api.get<DashboardMetrics>("/dashboard/metrics", token);
}

export function fetchClientsList(
  token: string,
  options?: {
    onboardingOnly?: boolean;
    page?: number;
    pageSize?: number;
    search?: string;
    merchantFilter?: "all" | number;
    salesRepId?: number | null;
  },
) {
  const params = new URLSearchParams();
  if (options?.onboardingOnly) params.set("onboarding_only", "true");
  if (options?.page) params.set("page", String(options.page));
  if (options?.pageSize) params.set("page_size", String(options.pageSize));
  const search = options?.search?.trim();
  if (search) params.set("search", search);
  if (options?.merchantFilter === "all") {
    params.set("all_merchants", "true");
  } else if (typeof options?.merchantFilter === "number") {
    params.set("merchant_id", String(options.merchantFilter));
  }
  if (options?.salesRepId) params.set("sales_rep_id", String(options.salesRepId));
  const query = params.toString();
  return api.get<Paginated<Client>>(`/clients${query ? `?${query}` : ""}`, token);
}

export function fetchMerchantOptions(token: string) {
  return api.get<MerchantBrief[]>("/merchants/options", token);
}

export function fetchMerchants(token: string, includeInactive = true) {
  const query = includeInactive ? "?include_inactive=true" : "";
  return api.get<Merchant[]>(`/merchants${query}`, token);
}

export function fetchUsers(token: string) {
  return api.get<Paginated<User>>("/users", token);
}

export function fetchAreas(token: string) {
  return api.get<Area[]>("/areas?include_inactive=true", token);
}

export function fetchRoles(token: string) {
  return api.get<Role[]>("/roles?include_inactive=true", token);
}

export function fetchDocusignConnection(token: string) {
  return api.get<DocusignConnection>("/docusign/connection", token);
}

export function fetchDocusignTemplates(token: string) {
  return api.get<DocusignTemplate[]>("/docusign/templates", token);
}

export function fetchDocusignEnvelopes(token: string, salesRepId?: number | null) {
  const qs =
    salesRepId != null ? `?sent_by_user_id=${encodeURIComponent(String(salesRepId))}` : "";
  return api.get<DocusignEnvelope[]>(`/docusign/envelopes${qs}`, token);
}

export function fetchCalendlyConnection(token: string, userId?: number | null) {
  return api.get<CalendlyConnection>(`/calendly/connection${calendlyUserQuery(userId)}`, token);
}

export function fetchCalendlyEvents(token: string, userId?: number | null) {
  return api.get<CalendlyEvent[]>(`/calendly/events${calendlyUserQuery(userId)}`, token);
}

export async function fetchCalendlyEventTypes(token: string, userId?: number | null) {
  const cached = readEventTypesCache(userId ?? null);
  if (cached && !isEventTypesCacheStale(userId ?? null)) {
    return cached.types;
  }

  const types = await api.get<CalendlyEventType[]>(
    `/calendly/event-types${calendlyUserQuery(userId)}`,
    token,
  );
  const normalized = types.map((type) => ({
    ...type,
    description: type.description ?? null,
    custom_questions: type.custom_questions ?? [],
  }));
  writeEventTypesCache(userId ?? null, normalized);
  return normalized;
}

export function fetchCalendlySalesReps(token: string) {
  return api.get<CalendlySalesRep[]>("/calendly/sales-reps", token);
}

export function fetchPortalMe(token: string) {
  return api.get<Client>("/portal/me", token);
}

export function fetchPortalDocuments(token: string) {
  return api.get<DocumentBrief[]>("/portal/documents", token);
}

export function fetchClientBoard(token: string, clientId: number) {
  return api.get<Board>(`/boards/client/${clientId}`, token);
}
