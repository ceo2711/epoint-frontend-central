"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { dispatchDocusignRefresh } from "@/features/docusign/docusign-events";
import { connectNotificationStream } from "@/features/notifications/notificationStream";
import { api } from "@/lib/api";
import type { Notification, Paginated } from "@/types/api";

interface NotificationsContextValue {
  unreadCount: number;
  recent: Notification[];
  loading: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  markRead: (ids: number[], options?: { optimistic?: boolean }) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_MS = 60_000;
const STREAM_RECONNECT_MS = 3_000;
const RECENT_LIMIT = 20;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const refreshRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!token || !user) {
      setUnreadCount(0);
      setRecent([]);
      hasLoadedRef.current = false;
      return;
    }

    const silent = options?.silent ?? hasLoadedRef.current;
    if (!silent) {
      setLoading(true);
    }

    try {
      const unread = await api.get<Paginated<Notification>>(
        "/notifications?unread_only=true&page_size=20",
        token,
      );
      setUnreadCount(unread.total);
      setRecent(unread.items);
      hasLoadedRef.current = true;
    } catch {
      if (!silent) {
        setUnreadCount(0);
        setRecent([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [token, user]);

  const applyNotification = useCallback((notification: Notification) => {
    if (notification.read_at) return;
    if (notification.event_type === "DOCUSIGN_ENVELOPE_COMPLETED") {
      const envelopeId = notification.payload?.envelope_id;
      dispatchDocusignRefresh(
        typeof envelopeId === "number" ? { envelopeId } : undefined,
      );
    }
    setRecent((prev) => {
      if (prev.some((item) => item.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev].slice(0, RECENT_LIMIT);
    });
    void refreshRef.current({ silent: true });
  }, []);

  const markRead = useCallback(
    async (ids: number[], options?: { optimistic?: boolean }) => {
      if (!token || ids.length === 0) return;
      const optimistic = options?.optimistic ?? true;

      if (optimistic) {
        setRecent((prev) => prev.filter((n) => !ids.includes(n.id)));
      }
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
      await api.post("/notifications/mark-read", { notification_ids: ids }, token);
      if (optimistic) {
        await refresh({ silent: true });
      }
    },
    [token, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!token || recent.length === 0) return;
    const ids = recent.map((n) => n.id);
    await markRead(ids);
  }, [token, recent, markRead]);

  refreshRef.current = refresh;
  const applyNotificationRef = useRef(applyNotification);
  applyNotificationRef.current = applyNotification;

  useEffect(() => {
    void refreshRef.current();
  }, [token, user]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      void refreshRef.current({ silent: true });
    }, POLL_MS);

    const onFocus = () => {
      void refreshRef.current({ silent: true });
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const abortController = new AbortController();

    const startStream = () => {
      connectNotificationStream(
        token,
        {
          onNotification: (notification) => applyNotificationRef.current(notification),
          onError: () => {
            if (abortController.signal.aborted) return;
            reconnectTimer = setTimeout(startStream, STREAM_RECONNECT_MS);
          },
        },
        abortController.signal,
      );
    };

    startStream();

    return () => {
      abortController.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [token]);

  const value = useMemo(
    () => ({ unreadCount, recent, loading, refresh, markRead, markAllRead }),
    [unreadCount, recent, loading, refresh, markRead, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  return ctx;
}
