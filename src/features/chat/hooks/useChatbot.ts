"use client";

import { useCallback, useState } from "react";

import { api } from "@/lib/api";
import type { ChatMessage, ChatbotApiResponse, PendingChatAction } from "@/features/chat/types";

function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeChatLocale(locale: string): "es" | "en" {
  return locale.toLowerCase().startsWith("en") ? "en" : "es";
}

export function useChatbot(token: string | null, defaultLocale: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeClientId, setActiveClientId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingChatAction | null>(null);
  const [chatLocale, setChatLocale] = useState<"es" | "en">(normalizeChatLocale(defaultLocale));

  const sendMessage = useCallback(
    async (text: string, uiLocale: string) => {
      const trimmed = text.trim();
      if (!trimmed || !token || loading) return;

      const userMessage: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const history = [...messages, userMessage].slice(-20).map((item) => ({
          role: item.role,
          content: item.content,
        }));

        const response = await api.post<ChatbotApiResponse>(
          "/chatbot/message",
          {
            message: trimmed,
            history: history.slice(0, -1),
            client_id: activeClientId,
            locale: uiLocale,
            chat_locale: chatLocale,
            pending_action: pendingAction,
          },
          token,
        );

        if (response.client_id) {
          setActiveClientId(response.client_id);
        }
        setPendingAction(response.pending_action);
        setChatLocale(normalizeChatLocale(response.chat_locale));

        setMessages((prev) => [
          ...prev,
          {
            id: newMessageId(),
            role: "assistant",
            content: response.reply,
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al enviar mensaje";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [token, loading, messages, activeClientId, pendingAction, chatLocale],
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setActiveClientId(null);
    setPendingAction(null);
    setChatLocale(normalizeChatLocale(defaultLocale));
  }, [defaultLocale]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    resetChat,
    activeClientId,
    pendingAction,
    chatLocale,
  };
}
