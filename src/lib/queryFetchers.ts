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
import type { Prospect } from "@/features/prospects/types";
import type { Source, SourceBrief } from "@/features/sources/types";
import type { Influencer, InfluencerBrief } from "@/features/influencers/types";
import type { Role } from "@/features/roles/types";
import type { Client, DocumentBrief, MerchantBrief, Paginated, Sede, User } from "@/types/api";
import { api } from "@/lib/api";

export function calendlyUserQuery(userId?: number | null): string {
  return userId ? `?user_id=${userId}` : "";
}

export function fetchClientStats(token: string) {
  return api.get<ClientStats>("/clients/stats", token);
}

export function fetchDashboardMetrics(
  token: string,
  options?: { sedeId?: number | null; salesRepId?: number | null },
) {
  const params = new URLSearchParams();
  if (options?.sedeId != null) params.set("sede_id", String(options.sedeId));
  if (options?.salesRepId != null) params.set("sales_rep_id", String(options.salesRepId));
  const query = params.toString();
  return api.get<DashboardMetrics>(`/dashboard/metrics${query ? `?${query}` : ""}`, token);
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
    sedeId?: number | null;
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
  if (options?.sedeId != null) params.set("sede_id", String(options.sedeId));
  const query = params.toString();
  return api.get<Paginated<Client>>(`/clients${query ? `?${query}` : ""}`, token);
}

export function fetchProspectsList(
  token: string,
  options?: {
    page?: number;
    pageSize?: number;
    search?: string;
    statusFilter?: string | null;
    salesRepId?: number | null;
    sedeId?: number | null;
    allMerchants?: boolean;
  },
) {
  const params = new URLSearchParams();
  params.set("page", String(options?.page ?? 1));
  params.set("page_size", String(options?.pageSize ?? 10));
  const search = options?.search?.trim();
  if (search) params.set("search", search);
  if (options?.statusFilter) params.set("status_filter", options.statusFilter);
  if (options?.salesRepId) params.set("sales_rep_id", String(options.salesRepId));
  if (options?.sedeId != null) params.set("sede_id", String(options.sedeId));
  if (options?.allMerchants) params.set("all_merchants", "true");
  return api.get<Paginated<Prospect>>(`/prospects?${params.toString()}`, token);
}

export function fetchSubSellerMetrics(token: string) {
  return api.get<unknown>("/sub-sellers/metrics", token);
}

export function syncCalendlyEvents(token: string, userId?: number | null) {
  return api.post(`/calendly/sync${calendlyUserQuery(userId)}`, {}, token, {
    silentHttpErrors: true,
  });
}

export function fetchMerchantOptions(token: string) {
  return api.get<MerchantBrief[]>("/merchants/options", token);
}

export function fetchMerchants(token: string, includeInactive = true) {
  const query = includeInactive ? "?include_inactive=true" : "";
  return api.get<Merchant[]>(`/merchants${query}`, token);
}

export function fetchSourceOptions(token: string) {
  return api.get<SourceBrief[]>("/sources/options", token);
}

export function fetchSources(token: string, includeInactive = true) {
  const query = includeInactive ? "?include_inactive=true" : "";
  return api.get<Source[]>(`/sources${query}`, token);
}

export function fetchInfluencerOptions(token: string, sedeId?: number | null) {
  const params = new URLSearchParams();
  if (sedeId != null) params.set("sede_id", String(sedeId));
  const query = params.toString() ? `?${params}` : "";
  return api.get<InfluencerBrief[]>(`/influencers/options${query}`, token);
}

export function fetchInfluencers(token: string, includeInactive = true) {
  const query = includeInactive ? "?include_inactive=true" : "";
  return api.get<Influencer[]>(`/influencers${query}`, token);
}

export function fetchSedes(token: string, includeInactive = true) {
  const query = includeInactive ? "?include_inactive=true" : "";
  return api.get<Sede[]>(`/sedes${query}`, token);
}

export function fetchUsers(
  token: string,
  filters?: {
    search?: string;
    sedeId?: number | null;
    roleId?: number | null;
  },
) {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  if (filters?.sedeId != null) params.set("sede_id", String(filters.sedeId));
  if (filters?.roleId != null) params.set("role_id", String(filters.roleId));
  const query = params.toString();
  return api.get<Paginated<User>>(`/users${query ? `?${query}` : ""}`, token);
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
  return api.get<Board>(`/boards/client/${clientId}`, token, {
    silentHttpErrors: true,
  });
}
