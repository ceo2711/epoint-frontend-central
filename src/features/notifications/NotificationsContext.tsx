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
import { getToken } from "@/features/auth/auth-storage";
import { dispatchDocusignRefresh } from "@/features/docusign/docusign-events";
import { dispatchPaymentCompleted } from "@/features/payments/payment-events";
import { connectNotificationStream } from "@/features/notifications/notificationStream";
import {
  playNotificationSound,
  setupNotificationSoundUnlock,
} from "@/features/notifications/notificationSound";
import { api } from "@/lib/api";
import { emitClientsRefresh } from "@/lib/clientEvents";
import { invalidateClientsQueries } from "@/lib/invalidateClients";
import { invalidateProspectsQueries } from "@/lib/invalidateProspects";
import type { Notification, Paginated } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationsContextValue {
  unreadCount: number;
  recent: Notification[];
  loading: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  markRead: (ids: number[], options?: { optimistic?: boolean }) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/** Respaldo si el SSE se cae; no debe competir con el stream en tiempo real. */
const POLL_MS = 10 * 60_000;
const INBOX_SYNC_MS = 30_000;
const INBOX_SYNC_START_MS = 4_000;
const STREAM_RECONNECT_MS = 3_000;
const RECENT_LIMIT = 20;
/** No competir con la navegación post-login. */
const INITIAL_FETCH_DEFER_MS = 800;
const STREAM_START_DEFER_MS = 2_500;

function isDuplicateNotification(prev: Notification[], notification: Notification): boolean {
  if (prev.some((item) => item.id === notification.id)) return true;
  if (notification.event_type === "DOCUSIGN_ENVELOPE_COMPLETED") {
    const envelopeId = notification.payload?.envelope_id;
    if (
      typeof envelopeId === "number" &&
      prev.some(
        (item) =>
          item.event_type === "DOCUSIGN_ENVELOPE_COMPLETED" &&
          item.payload?.envelope_id === envelopeId,
      )
    ) {
      return true;
    }
  }
  return false;
}

export function NotificationsProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const { token, user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const knownNotificationIdsRef = useRef<Set<number>>(new Set());
  const recentRef = useRef<Notification[]>([]);
  const refreshRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});
  const initialFetchTokenRef = useRef<string | null>(null);

  recentRef.current = recent;

  const announceNewNotifications = useCallback((items: Notification[]) => {
    if (!hasLoadedRef.current) {
      knownNotificationIdsRef.current = new Set(items.map((item) => item.id));
      return;
    }

    const fresh = items.filter((item) => !knownNotificationIdsRef.current.has(item.id));
    knownNotificationIdsRef.current = new Set(items.map((item) => item.id));
    if (fresh.length > 0) {
      void playNotificationSound();
    }
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || !token || !user) {
        setUnreadCount(0);
        setRecent([]);
        hasLoadedRef.current = false;
        knownNotificationIdsRef.current = new Set();
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
        announceNewNotifications(unread.items);
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
    },
    [announceNewNotifications, enabled, token, user],
  );

  const applyNotification = useCallback(
    (notification: Notification) => {
      if (notification.read_at) return;
      if (notification.event_type === "DOCUSIGN_ENVELOPE_COMPLETED") {
        const envelopeId = notification.payload?.envelope_id;
        dispatchDocusignRefresh(
          typeof envelopeId === "number" ? { envelopeId } : undefined,
        );
      }
      if (notification.event_type === "CLIENT_EMAIL_RECEIVED") {
        const emailClientId = notification.payload?.client_id;
        void invalidateClientsQueries(
          queryClient,
          typeof emailClientId === "number" ? { clientId: emailClientId } : undefined,
        );
        emitClientsRefresh(
          typeof emailClientId === "number" ? { clientId: emailClientId } : undefined,
        );
      }
      if (
        notification.event_type === "PAYMENT_LINK_COMPLETED" ||
        notification.event_type === "PROSPECT_CONVERTED"
      ) {
        const paymentLinkId = notification.payload?.payment_link_id;
        const prospectId = notification.payload?.prospect_id;
        const clientId = notification.payload?.client_id;
        dispatchPaymentCompleted({
          paymentLinkId: typeof paymentLinkId === "number" ? paymentLinkId : undefined,
          prospectId: typeof prospectId === "number" ? prospectId : null,
        });
        void invalidateProspectsQueries(queryClient);
        void invalidateClientsQueries(
          queryClient,
          typeof clientId === "number" ? { clientId } : undefined,
        );
      }

      const prev = recentRef.current;
      const isNew = !isDuplicateNotification(prev, notification);
      if (!isNew) {
        void refreshRef.current({ silent: true });
        return;
      }

      knownNotificationIdsRef.current.add(notification.id);
      setRecent((current) => {
        if (isDuplicateNotification(current, notification)) return current;
        return [notification, ...current].slice(0, RECENT_LIMIT);
      });
      setUnreadCount((count) => count + 1);
      void playNotificationSound();
      void refreshRef.current({ silent: true });
    },
    [queryClient],
  );

  const markRead = useCallback(
    async (ids: number[], options?: { optimistic?: boolean }) => {
      if (!token || ids.length === 0) return;
      const optimistic = options?.optimistic ?? true;

      if (optimistic) {
        setRecent((prev) => prev.filter((n) => !ids.includes(n.id)));
        ids.forEach((id) => knownNotificationIdsRef.current.delete(id));
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
    if (!enabled) {
      setUnreadCount(0);
      setRecent([]);
      hasLoadedRef.current = false;
      knownNotificationIdsRef.current = new Set();
      initialFetchTokenRef.current = null;
      return;
    }
    if (!token) {
      initialFetchTokenRef.current = null;
      return;
    }
    const fetchKey = token.slice(-16);
    if (initialFetchTokenRef.current === fetchKey) return;
    initialFetchTokenRef.current = fetchKey;
    const timer = window.setTimeout(() => {
      void refreshRef.current({ silent: true });
    }, INITIAL_FETCH_DEFER_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, token]);

  useEffect(() => {
    if (!enabled) return;
    return setupNotificationSoundUnlock();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !token) return;

    const interval = setInterval(() => {
      void refreshRef.current({ silent: true });
    }, POLL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, token]);

  useEffect(() => {
    if (!enabled || !token || !hasPermission("clients:read")) return;

    const syncInbox = () => {
      void api
        .post<{ ingested: number }>(
          "/clients/inbox/sync",
          {},
          token,
          { silentHttpErrors: true },
        )
        .then((result) => {
          if (result.ingested > 0) {
            void invalidateClientsQueries(queryClient);
            emitClientsRefresh();
          }
        })
        .catch(() => undefined);
    };

    const startTimer = window.setTimeout(syncInbox, INBOX_SYNC_START_MS);
    const interval = window.setInterval(syncInbox, INBOX_SYNC_MS);
    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(interval);
    };
  }, [enabled, token, hasPermission, queryClient]);

  useEffect(() => {
    if (!enabled || !token) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let startTimer: ReturnType<typeof setTimeout> | null = null;
    const abortController = new AbortController();

    const startStream = () => {
      connectNotificationStream(
        () => getToken() ?? token,
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

    startTimer = setTimeout(startStream, STREAM_START_DEFER_MS);

    return () => {
      abortController.abort();
      if (startTimer) clearTimeout(startTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [enabled, token]);

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
