export interface DocusignConnection {
  connected: boolean;
  account_id?: string | null;
  default_template_id?: string | null;
  default_template_role_name?: string | null;
  auth_server?: string | null;
}

export interface DocusignTemplate {
  template_id: string;
  name: string;
  description?: string | null;
}

export interface DocusignTemplateRole {
  role_name: string;
  recipient_type?: string | null;
}

export interface DocusignTemplateDetail extends DocusignTemplate {
  roles: DocusignTemplateRole[];
}

export interface DocusignEnvelope {
  id: number;
  docusign_envelope_id: string;
  signer_name: string;
  signer_email: string;
  template_id: string;
  template_role_name: string;
  subject: string;
  status: string;
  client_id?: number | null;
  client_name?: string | null;
  prospect_id?: number | null;
  sent_by_user_id: number;
  sent_by_name?: string | null;
  sent_at: string;
  completed_at?: string | null;
  has_signed_document?: boolean;
  can_register_client?: boolean;
  client_registered?: boolean;
}

export interface DocusignRegisterClientPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  merchant_id: number;
}

export interface DocusignRegisterClientResponse {
  envelope: DocusignEnvelope;
  client_id: number;
  message: string;
}

export interface DocusignSendPayload {
  signer_name: string;
  signer_email: string;
  template_id?: string;
  template_role_name?: string;
  subject?: string;
  client_id?: number;
  prospect_id?: number;
  text_tabs?: Record<string, string>;
}
