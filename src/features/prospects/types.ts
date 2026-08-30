export type ProspectStatus =
  | "PENDIENTE_CONTACTAR"
  | "LEAD_CONTACTADO"
  | "LEAD_CERRADO"
  | "CONTRATO_ENVIADO"
  | "PAGO_PARCIAL"
  | "PAGO_COMPLETADO";

export const PROSPECT_STATUS_ORDER: ProspectStatus[] = [
  "PENDIENTE_CONTACTAR",
  "LEAD_CONTACTADO",
  "CONTRATO_ENVIADO",
  "PAGO_PARCIAL",
  "PAGO_COMPLETADO",
  "LEAD_CERRADO",
];

export interface SalesRepBrief {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ProspectCalendlyBrief {
  id: number;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  invitee_name: string | null;
  invitee_email: string | null;
  meeting_url: string | null;
  event_type_name: string | null;
}

export interface ProspectEnvelopeBrief {
  id: number;
  subject: string;
  status: string;
  signer_name: string;
  signer_email: string;
  sent_at: string;
  completed_at: string | null;
}

export interface ProspectPaymentBrief {
  id: number;
  amount: string;
  amount_paid?: string;
  remaining_amount?: string;
  allow_partial?: boolean;
  currency: string;
  status: string;
  payment_url: string;
  paid_at: string | null;
  created_at: string;
}

export interface ProspectHistoryEntry {
  id: number;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  changed_by_user_id: number;
  changed_by_name: string | null;
  created_at: string;
}

export interface Prospect {
  id: number;
  merchant_id: number;
  assigned_to_user_id: number;
  status: ProspectStatus;
  is_qualified: boolean;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  source: string | null;
  influencer_id: number | null;
  influencer_name: string | null;
  notes: string | null;
  converted_client_id: number | null;
  calendly_event_id: number | null;
  docusign_envelope_id: number | null;
  payment_link_id: number | null;
  created_at: string;
  updated_at: string;
  assigned_to: SalesRepBrief | null;
  merchant_name: string | null;
}

export interface ProspectDetail extends Prospect {
  history: ProspectHistoryEntry[];
  calendly_event: ProspectCalendlyBrief | null;
  docusign_envelope: ProspectEnvelopeBrief | null;
  docusign_envelopes: ProspectEnvelopeBrief[];
  payment_link: ProspectPaymentBrief | null;
  payment_links: ProspectPaymentBrief[];
}

export interface ProspectPipelineSummary {
  prospect_id: number;
  status: ProspectStatus;
  is_qualified: boolean;
  history: ProspectHistoryEntry[];
  calendly_event: ProspectCalendlyBrief | null;
  docusign_envelopes: ProspectEnvelopeBrief[];
  payment_link: ProspectPaymentBrief | null;
  payment_links: ProspectPaymentBrief[];
}

export interface ProspectFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  influencer_id: string;
  merchant_id: string;
  sede_id: string;
  assigned_to_user_id: string;
  is_qualified: boolean;
  notes: string;
}

export const EMPTY_PROSPECT_FORM: ProspectFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  source: "OTHER",
  influencer_id: "",
  merchant_id: "",
  sede_id: "",
  assigned_to_user_id: "",
  is_qualified: true,
  notes: "",
};
