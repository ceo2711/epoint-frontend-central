export interface MerchantScope {
  id: number;
  code: string;
  name: string;
}

export interface ClientStats {
  pending_review: number;
  approved_in_onboarding: number;
  rejected: number;
  onboarding_in_progress: number;
  completed: number;
  total: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface TimeseriesPoint {
  date: string;
  count: number;
}

export interface ProjectionPoint {
  date: string;
  projected: number;
}

export interface AreaMetrics {
  code: string;
  name: string;
  scope: "personal" | "general";
  total: number;
  in_pipeline: number;
  completed: number;
  conversion_rate: number | null;
  by_status: StatusCount[];
  by_source?: SourceCount[];
}

export interface DashboardMetrics {
  merchant: MerchantScope;
  viewer_scope: "personal" | "general";
  summary: ClientStats;
  by_status: Record<string, number>;
  areas: AreaMetrics[];
  registrations: TimeseriesPoint[];
  prospect_registrations: TimeseriesPoint[];
  completions: TimeseriesPoint[];
  registration_projections: ProjectionPoint[];
  prospect_registration_projections: ProjectionPoint[];
  completion_projections: ProjectionPoint[];
}

export type DashboardAreaCode = "ONBOARDING" | "VENTAS";
