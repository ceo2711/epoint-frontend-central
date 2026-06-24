import type { ChatMessage, PendingChatAction } from "@/features/chat/types";

const STORAGE_PREFIX = "epoint_chat_v1";
const MAX_PERSISTED_MESSAGES = 100;

export interface PersistedChatState {
  messages: ChatMessage[];
  pendingAction: PendingChatAction | null;
  chatLocale: "es" | "en";
  activeClientId: number | null;
  updatedAt: string;
}

function storageKey(userId: number): string {
  return `${STORAGE_PREFIX}_${userId}`;
}

function isChatLocale(value: unknown): value is "es" | "en" {
  return value === "es" || value === "en";
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string"
  );
}

function isPendingChatAction(value: unknown): value is PendingChatAction {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.action === "string";
}

function normalizeState(raw: unknown): PersistedChatState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.messages)) return null;

  const messages = data.messages.filter(isChatMessage).slice(-MAX_PERSISTED_MESSAGES);
  const pendingAction = isPendingChatAction(data.pendingAction) ? data.pendingAction : null;
  const chatLocale = isChatLocale(data.chatLocale) ? data.chatLocale : "es";
  const activeClientId =
    typeof data.activeClientId === "number" && Number.isFinite(data.activeClientId)
      ? data.activeClientId
      : null;

  return {
    messages,
    pendingAction,
    chatLocale,
    activeClientId,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
}

export function loadChatState(userId: number): PersistedChatState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveChatState(
  userId: number,
  state: Omit<PersistedChatState, "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: PersistedChatState = {
    messages: state.messages.slice(-MAX_PERSISTED_MESSAGES),
    pendingAction: state.pendingAction,
    chatLocale: state.chatLocale,
    activeClientId: state.activeClientId,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey(userId), JSON.stringify(payload));
}

export function clearChatState(userId: number): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(userId));
}
