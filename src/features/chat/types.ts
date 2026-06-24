export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface PendingChatAction {
  action:
    | "register_client"
    | "approve_client"
    | "reject_client"
    | "approve_all"
    | "reject_all"
    | "upload_document"
    | "upload_board_attachment";
  client_id?: number | null;
  client_ids?: number[];
  advisor_user_id?: number | null;
  draft?: Record<string, unknown>;
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
  clients_updated?: boolean;
}
