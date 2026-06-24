import { beforeEach, describe, expect, it } from "vitest";

import {
  clearChatState,
  loadChatState,
  saveChatState,
} from "@/features/chat/chat-storage";

describe("chat-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no conversation is stored for the user", () => {
    expect(loadChatState(42)).toBeNull();
  });

  it("stores and retrieves conversation per user", () => {
    saveChatState(7, {
      messages: [{ id: "1", role: "user", content: "Hola" }],
      pendingAction: null,
      chatLocale: "es",
      activeClientId: 103,
    });

    const saved = loadChatState(7);
    expect(saved?.messages).toHaveLength(1);
    expect(saved?.messages[0].content).toBe("Hola");
    expect(saved?.activeClientId).toBe(103);
  });

  it("keeps conversations isolated by user id", () => {
    saveChatState(1, {
      messages: [{ id: "1", role: "user", content: "Usuario 1" }],
      pendingAction: null,
      chatLocale: "es",
      activeClientId: null,
    });
    saveChatState(2, {
      messages: [{ id: "2", role: "user", content: "Usuario 2" }],
      pendingAction: null,
      chatLocale: "en",
      activeClientId: null,
    });

    expect(loadChatState(1)?.messages[0].content).toBe("Usuario 1");
    expect(loadChatState(2)?.messages[0].content).toBe("Usuario 2");
  });

  it("clears stored conversation for the user", () => {
    saveChatState(9, {
      messages: [{ id: "1", role: "assistant", content: "Hola" }],
      pendingAction: null,
      chatLocale: "es",
      activeClientId: null,
    });

    clearChatState(9);
    expect(loadChatState(9)).toBeNull();
  });

  it("ignores invalid stored payloads", () => {
    localStorage.setItem("epoint_chat_v1_5", JSON.stringify({ messages: "invalid" }));
    expect(loadChatState(5)).toBeNull();
  });
});
