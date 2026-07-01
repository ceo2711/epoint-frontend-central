export interface DocusignConnection {
  connected: boolean;
  account_id?: string | null;
  account_name?: string | null;
  impersonated_user_email?: string | null;
  auth_server?: string | null;
  default_template_id?: string | null;
  default_template_role_name?: string | null;
  connected_at?: string | null;
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
  sent_by_user_id: number;
  sent_by_name?: string | null;
  sent_at: string;
  completed_at?: string | null;
}

export interface DocusignConnectPayload {
  integration_key: string;
  impersonated_user_id: string;
  account_id: string;
  private_key: string;
  auth_server?: string;
  default_template_id?: string;
  default_template_role_name?: string;
}

export interface DocusignSendPayload {
  signer_name: string;
  signer_email: string;
  template_id?: string;
  template_role_name?: string;
  subject?: string;
  client_id?: number;
  text_tabs?: Record<string, string>;
}
