import { refreshAccessToken } from "@/features/auth/auth-session";
import { API_URL } from "@/lib/api";
import { logClientError } from "@/lib/user-facing-error";
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

async function readNotificationStream(
  response: Response,
  handlers: NotificationStreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const reader = response.body!.getReader();
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
}

/** Conexión SSE con Bearer token (EventSource nativo no soporta Authorization). */
export function connectNotificationStream(
  getToken: () => string | null,
  handlers: NotificationStreamHandlers,
  signal: AbortSignal,
): void {
  void (async () => {
    try {
      let token = getToken();
      if (!token) return;

      let response = await fetch(`${API_URL}/notifications/stream`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal,
      });

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          response = await fetch(`${API_URL}/notifications/stream`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${refreshed}`,
              Accept: "text/event-stream",
            },
            signal,
          });
        }
      }

      if (!response.ok || !response.body) {
        if (response.status !== 401) {
          logClientError("notifications:stream", new Error(`HTTP ${response.status}`), {
            baseUrl: API_URL,
          });
        }
        throw new Error("Notification stream failed");
      }

      await readNotificationStream(response, handlers, signal);
    } catch (error) {
      if (signal.aborted) return;
      if (!(error instanceof Error && error.message === "Notification stream failed")) {
        logClientError("notifications:stream", error, { baseUrl: API_URL });
      }
      handlers.onError?.(error);
    }
  })();
}
