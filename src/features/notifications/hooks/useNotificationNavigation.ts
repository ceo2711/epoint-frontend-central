"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { getNotificationHref } from "@/features/notifications/notification-routes";
import type { Notification } from "@/types/api";

export function useNotificationNavigation() {
  const router = useRouter();
  const { user } = useAuth();
  const { markRead } = useNotifications();

  const openNotification = useCallback(
    async (notification: Notification) => {
      const href = getNotificationHref(notification, user?.role.code);
      if (!href) return;
      router.push(href);
      if (!notification.read_at) {
        void markRead([notification.id], { optimistic: false });
      }
    },
    [user?.role.code, markRead, router],
  );

  const getHref = useCallback(
    (notification: Notification) => getNotificationHref(notification, user?.role.code),
    [user?.role.code],
  );

  return { openNotification, getHref };
}
