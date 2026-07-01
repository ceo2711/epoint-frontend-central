import { API_URL } from "@/lib/api";
import type { Notification } from "@/types/api";

type StreamMessage =
  | { type: "connected" }
  | { type: "notification"; notification: Notification };

export type NotificationStreamHandlers = {
  onNotification: (notification: Notification) => void;
  onConnected?: () => void;
  onError?: (error: unknown) => void;
};

function parseSseEvent(rawEvent: string): StreamMessage | null {
  const dataLines = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  if (dataLines.length === 0) return null;

  try {
    return JSON.parse(dataLines.join("\n")) as StreamMessage;
  } catch {
    return null;
  }
}

/** Conexión SSE con Bearer token (EventSource nativo no soporta Authorization). */
export function connectNotificationStream(
  token: string,
  handlers: NotificationStreamHandlers,
  signal: AbortSignal,
): void {
  void (async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/stream`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Notification stream failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const message = parseSseEvent(rawEvent);
          if (!message) continue;
          if (message.type === "connected") {
            handlers.onConnected?.();
            continue;
          }
          if (message.type === "notification") {
            handlers.onNotification(message.notification);
          }
        }
      }

      if (!signal.aborted) {
        handlers.onError?.(new Error("Notification stream closed"));
      }
    } catch (error) {
      if (signal.aborted) return;
      handlers.onError?.(error);
    }
  })();
}
