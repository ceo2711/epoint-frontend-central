"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { NotificationBadge } from "@/components/ui/NotificationBadge";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { NotificationDetailModal } from "@/features/notifications/components/NotificationDetailModal";
import {
  isSaleCongratsNotification,
  SaleCongratsModal,
} from "@/features/notifications/components/SaleCongratsModal";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNotificationNavigation } from "@/features/notifications/hooks/useNotificationNavigation";
import { formatRelativeDateTime } from "@/lib/format-datetime";
import type { Notification } from "@/types/api";

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function NotificationItem({
  item,
  locale,
  onSelect,
}: {
  item: Notification;
  locale: string;
  onSelect: (n: Notification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="notification-item notification-item-unread w-full text-left transition"
    >
      <div className="flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-900">{item.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.body}</p>
          <p className="mt-1.5 text-[10px] text-slate-400">
            {formatRelativeDateTime(item.created_at, locale)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { t, locale } = useTranslation();
  const { unreadCount, recent, loading, markRead, markAllRead } = useNotifications();
  const { openNotification, getHref } = useNotificationNavigation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (!selected || selected.read_at) return;
    void markRead([selected.id]);
  }, [selected, markRead]);

  function handleSelect(notification: Notification) {
    setOpen(false);
    setSelected(notification);
  }

  function handleCloseModal() {
    setSelected(null);
  }

  async function handleNavigateFromModal() {
    if (!selected) return;
    const notification = selected;
    setSelected(null);
    if (getHref(notification)) {
      await openNotification(notification);
    }
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          aria-label={t("notifications.bell")}
          aria-expanded={open}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <NotificationBadge count={unreadCount} className="absolute -right-1 -top-1 ring-white" />
          )}
        </button>

        {open ? (
          <ModalPortal>
            <div
              ref={menuRef}
              className="notification-dropdown notification-dropdown--portal"
              style={{ top: coords.top, right: coords.right }}
            >
              <div className="notification-dropdown-header">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t("notifications.title")}</p>
                  {unreadCount > 0 && (
                    <p className="text-xs text-slate-500">{t("notifications.unreadCount", { count: unreadCount })}</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-800" onClick={markAllRead}>
                    {t("notifications.markAllRead")}
                  </button>
                )}
              </div>

              <div className="notification-dropdown-body">
                {loading && recent.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">{t("common.loading")}</p>
                )}
                {!loading && recent.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">{t("notifications.empty")}</p>
                )}
                {recent.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    item={notification}
                    locale={locale}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          </ModalPortal>
        ) : null}
      </div>

      {selected &&
        (isSaleCongratsNotification(selected) ? (
          <SaleCongratsModal
            notification={selected}
            canNavigate={!!getHref(selected)}
            onNavigate={handleNavigateFromModal}
            onClose={handleCloseModal}
          />
        ) : (
          <NotificationDetailModal
            notification={selected}
            canNavigate={!!getHref(selected)}
            onNavigate={handleNavigateFromModal}
            onClose={handleCloseModal}
          />
        ))}
    </>
  );
}
