export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const CHAT_MESSAGE_MAX_LENGTH = 6000;

export interface PendingChatAction {
  action:
    | "register_client"
    | "approve_client"
    | "reject_client"
    | "approve_all"
    | "reject_all"
    | "upload_document"
    | "upload_board_attachment"
    | "create_calendly_event"
    | "update_calendly_event"
    | "cancel_calendly_event";
  client_id?: number | null;
  client_ids?: number[];
  advisor_user_id?: number | null;
  draft?: Record<string, unknown>;
}

export interface ChatCalendlyOptions {
  step: "event_type" | "date" | "slot" | "invitee" | "events_list" | "confirm";
  event_types: Array<Record<string, unknown>>;
  slots: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  custom_questions: Array<Record<string, unknown>>;
  draft_summary: Record<string, unknown>;
  ready_to_confirm: boolean;
}

export interface ChatCalendlySelection {
  type:
    | "event_type"
    | "date"
    | "slot"
    | "submit_create"
    | "submit_update"
    | "cancel_event"
    | "start_edit"
    | "start_create";
  uri?: string;
  name?: string;
  value?: string;
  label?: string;
  event_id?: number;
  draft?: Record<string, unknown>;
  event_type_uri?: string;
  event_type_name?: string;
  date?: string;
  start_time?: string;
  slot_label?: string;
  invitee_name?: string;
  invitee_email?: string;
  custom_questions?: Array<Record<string, unknown>>;
  questions_and_answers?: Array<Record<string, unknown>>;
}

export interface ChatUploadOptions {
  kind: "document" | "board_card";
  document_types: Array<{ value: string; label: string }>;
  board_cards: Array<{ id: number; title: string; column: string; status?: string }>;
  ready_for_file: boolean;
}

export interface ClientApprovalResult {
  client_id: number;
  client_name: string;
  client_email: string;
  temp_password: string;
  advisor_name: string;
}

export interface ChatbotApiResponse {
  reply: string;
  client_id: number | null;
  pending_action: PendingChatAction | null;
  chat_locale: string;
  client_approval: ClientApprovalResult | null;
  client_approvals?: ClientApprovalResult[];
  upload_options: ChatUploadOptions | null;
  calendly_options: ChatCalendlyOptions | null;
  clients_updated?: boolean;
  calendly_updated?: boolean;
}
