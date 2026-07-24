export interface Influencer {
  id: number;
  name: string;
  handle: string | null;
  notes: string | null;
  sede_id: number;
  sede_name: string | null;
  sales_rep_user_id: number;
  sales_rep_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InfluencerBrief {
  id: number;
  name: string;
  handle: string | null;
  sales_rep_user_id: number;
  sales_rep_name: string | null;
}

export type InfluencerFormData = {
  name: string;
  handle: string;
  notes: string;
  sales_rep_user_id: string;
  sede_id: string;
};

export const EMPTY_INFLUENCER_FORM: InfluencerFormData = {
  name: "",
  handle: "",
  notes: "",
  sales_rep_user_id: "",
  sede_id: "",
};
