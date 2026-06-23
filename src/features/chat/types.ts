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
    | "reject_all";
  client_id?: number | null;
  client_ids?: number[];
  advisor_user_id?: number | null;
  draft?: Record<string, unknown>;
}

export interface ChatbotApiResponse {
  reply: string;
  client_id: number | null;
  pending_action: PendingChatAction | null;
  chat_locale: string;
}
