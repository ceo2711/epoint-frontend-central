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

export interface CommissionDayPoint {
  date: string;
  daily_paid: number;
  daily_commission: number;
  cumulative_commission: number;
}

export interface WeekdaySalesPoint {
  weekday: number;
  paid_count: number;
  paid_amount: number;
}

export interface SalesRepLeaderboardItem {
  user_id: number;
  first_name: string;
  last_name: string;
  paid_count: number;
  paid_amount: number;
  commission: number;
}

export interface SalesLeadershipMetrics {
  active_sales_reps: number;
  team_monthly_paid_count: number;
  team_monthly_paid_total: number;
  team_monthly_commission: number;
  commission_per_sale: number;
  weekday_sales: WeekdaySalesPoint[];
  best_weekday: number | null;
  best_weekday_paid_count: number;
  best_weekday_paid_amount: number;
  leaderboard: SalesRepLeaderboardItem[];
}

export interface InfluencerLeadCount {
  influencer_id: number;
  name: string;
  handle?: string | null;
  count: number;
  converted_count: number;
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
  /** Prospectos con influencer (incluye convertidos a cliente). */
  by_influencer?: InfluencerLeadCount[];
  /** Comisión del mes (personal o equipo del líder). */
  monthly_paid_total?: number | null;
  monthly_commission?: number | null;
  /** Monto fijo USD por cada pago concretado. */
  commission_per_sale?: number | null;
  monthly_paid_count?: number | null;
  commission_series?: CommissionDayPoint[];
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
  sales_leadership?: SalesLeadershipMetrics | null;
}

export type DashboardAreaCode = "ONBOARDING" | "VENTAS";
