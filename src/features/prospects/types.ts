export type ProspectStatus =
  | "LEAD_CALIFICADO"
  | "LEAD_NO_CALIFICADO"
  | "PENDIENTE_CONTACTAR"
  | "LEAD_CONTACTADO"
  | "LEAD_CERRADO"
  | "CONTRATO_ENVIADO"
  | "PAGO_COMPLETADO";

export const INITIAL_PROSPECT_STATUSES: ProspectStatus[] = ["LEAD_CALIFICADO", "LEAD_NO_CALIFICADO"];

export const PROSPECT_STATUS_ORDER: ProspectStatus[] = [
  "LEAD_CALIFICADO",
  "LEAD_NO_CALIFICADO",
  "PENDIENTE_CONTACTAR",
  "LEAD_CONTACTADO",
  "CONTRATO_ENVIADO",
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
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  source: string | null;
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
  payment_link: ProspectPaymentBrief | null;
}

export interface ProspectFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  merchant_id: string;
  initial_status: ProspectStatus;
  notes: string;
}

export const EMPTY_PROSPECT_FORM: ProspectFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  source: "OTHER",
  merchant_id: "",
  initial_status: "LEAD_CALIFICADO",
  notes: "",
};
