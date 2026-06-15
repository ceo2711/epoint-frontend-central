"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";
import type { Notification, Paginated } from "@/types/api";

interface NotificationsContextValue {
  unreadCount: number;
  recent: Notification[];
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (ids: number[], options?: { optimistic?: boolean }) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_MS = 60_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !user) {
      setUnreadCount(0);
      setRecent([]);
      return;
    }
    setLoading(true);
    try {
      const unread = await api.get<Paginated<Notification>>(
        "/notifications?unread_only=true&page_size=20",
        token,
      );
      setUnreadCount(unread.total);
      setRecent(unread.items);
    } catch {
      setUnreadCount(0);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

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
        await refresh();
      }
    },
    [token, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!token || recent.length === 0) return;
    const ids = recent.map((n) => n.id);
    await markRead(ids);
  }, [token, recent, markRead]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, refresh]);

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
