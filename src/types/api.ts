export interface RoleBrief {
  id: number;
  code: string;
  name: string;
}

export interface AreaBrief {
  id: number;
  code: string;
  name: string;
}

export interface SedeBrief {
  id: number;
  code: string;
  name: string;
}

export interface ParentUserBrief {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: RoleBrief;
  area: AreaBrief | null;
  sede_id?: number | null;
  sede?: SedeBrief | null;
  must_change_password: boolean;
  totp_enabled: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  avatar_url?: string | null;
  permissions?: string[];
  client_id?: number | null;
  parent_user_id?: number | null;
  parent?: ParentUserBrief | null;
  can_manage_sub_sellers?: boolean;
  is_sub_seller?: boolean;
  previous_month_sales?: number | null;
  merchants?: MerchantBrief[];
  active_merchant_id?: number | null;
  active_merchant?: MerchantBrief | null;
}

export interface Area {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  permissions: { id: number; code: string; name: string }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface LoginResponse {
  requires_2fa?: boolean;
  temp_token?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_type: string;
  must_change_password: boolean;
  user: User | null;
}

export interface TotpSetupResponse {
  secret: string;
  provisioning_uri: string;
}

export interface Notification {
  id: number;
  event_type: string;
  channel: string;
  title: string;
  body: string;
  payload?: { client_id?: number; [key: string]: unknown } | null;
  read_at: string | null;
  created_at: string;
}

export interface Merchant {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  sede_id: number;
}

export interface Source {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SourceBrief {
  code: string;
  name: string;
}

export interface Sede {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  avatar_url?: string | null;
}

export interface MerchantBrief {
  id: number;
  code: string;
  name: string;
  sede_id?: number | null;
}

export interface AdvisorBrief {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ClientSignedContractBrief {
  envelope_id: number;
  signed_at: string;
  subject: string;
  has_document: boolean;
}

export interface Client {
  id: number;
  status: string;
  is_qualified?: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string | null;
  merchant: MerchantBrief | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  approved_at: string | null;
  date_of_birth: string | null;
  has_ssn: boolean;
  registered_by_user_id: number;
  registered_by?: AdvisorBrief | null;
  created_at: string;
  docusign_contract_signed_at?: string | null;
  signed_contract?: ClientSignedContractBrief | null;
  has_portal_access?: boolean;
  portal_email?: string | null;
  portal_login_url?: string | null;
  portal_temp_password?: string | null;
  advisor?: AdvisorBrief | null;
  advisors?: AdvisorBrief[];
  addresses?: Address[];
  vehicles?: Vehicle[];
  documents?: DocumentBrief[];
  source_prospect?: import("@/features/prospects/types").ProspectPipelineSummary | null;
  /** True cuando el portal ya puede mostrar el tablero (datos + docs OK). */
  board_unlocked?: boolean;
}

export interface ClientPortalPassword {
  email: string;
  temp_password: string;
  portal_login_url: string;
}

export interface ClientConflict {
  client_id: number;
  client_name: string;
  client_email: string;
}

export interface ClientAvailability {
  available: boolean;
  email: ClientConflict | null;
  phone: ClientConflict | null;
}

export interface ProspectContactConflict extends ClientConflict {
  kind: "client" | "prospect";
}

export interface ProspectAvailability {
  available: boolean;
  email: ProspectContactConflict | null;
  phone: ProspectContactConflict | null;
}

export interface Address {
  id: number;
  type: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  residence_since_month: number | null;
  residence_since_year: number | null;
}

export interface Vehicle {
  id: number;
  order: number;
  model: string;
  year: number;
  color: string;
  license_plate?: string | null;
}

export interface LocalizedStringList {
  en: string[];
  es: string[];
}

export interface DocumentBrief {
  id: number;
  type: string;
  verification_status: string;
  original_filename: string;
  mime_type?: string | null;
  download_url?: string | null;
  expires_at: string | null;
  uploaded_at: string;
  rejection_reasons?: LocalizedStringList | null;
  approval_reasons?: LocalizedStringList | null;
}

export interface BoardCard {
  id: number;
  title: string;
  description_md: string | null;
  instructions_md: string | null;
  external_links: string | null;
  status: string;
  /** Etiqueta visual (URGENTE, RECHAZADA, etc.). Independiente del status kanban. */
  label?: string | null;
  position: number;
  requires_credentials: boolean;
  requires_file_upload: boolean;
  client_result_text: string | null;
  comments: CardComment[];
  attachments: CardAttachment[];
  has_credentials: boolean;
}

export interface CardComment {
  id: number;
  body: string;
  is_internal: boolean;
  author_name: string;
  created_at: string;
}

export interface CardAttachment {
  id: number;
  type: string;
  original_filename: string;
  mime_type?: string | null;
  download_url: string | null;
  comment_id?: number | null;
  uploaded_by_name?: string | null;
  created_at?: string | null;
  verification_status?: string | null;
  rejection_reasons?: LocalizedStringList | null;
  approval_reasons?: LocalizedStringList | null;
}

export interface BoardList {
  id: number;
  title: string;
  position: number;
  cards: BoardCard[];
}

export interface Board {
  id: number;
  client_id: number;
  template_code: string;
  lists: BoardList[];
}

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  PENDIENTE_DE_REVISION: "Pendiente de revisión",
  RECHAZADO: "Rechazado",
  APROBADO_PARA_ONBOARDING: "Aprobado",
  EN_CARGA_DATOS: "En carga de datos",
  DOCUMENTOS_EN_REVISION: "Documentos en revisión",
  LISTO_PARA_TRABAJAR: "Listo para trabajar",
  ONBOARDING_EN_PROGRESO: "Onboarding en progreso",
  ONBOARDING_COMPLETADO: "Completado",
  INACTIVO: "Inactivo",
};

export const DOCUMENT_TYPES = [
  { value: "SSN_CARD", label: "Tarjeta SSN" },
  { value: "DRIVERS_LICENSE_FRONT", label: "Licencia (frente)" },
  { value: "DRIVERS_LICENSE_BACK", label: "Licencia (dorso)" },
  { value: "UTILITY_BILL", label: "Utility Bill" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "GREEN_CARD", label: "Green Card" },
  { value: "WORK_PERMIT", label: "Permiso de trabajo" },
] as const;

/** @deprecated Prefer DOCUMENT_SECTIONS from document-requirements for UI grouping */

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  EN_REVISION: "En revisión",
  COMPLETADA: "Completada",
};
