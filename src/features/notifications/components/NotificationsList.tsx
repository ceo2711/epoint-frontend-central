"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNotificationNavigation } from "@/features/notifications/hooks/useNotificationNavigation";
import { formatDateTime } from "@/lib/format-datetime";
import type { Notification } from "@/types/api";

function NotificationCard({
  notification: n,
  locale,
  canNavigate,
  opening,
  onOpen,
  onDismiss,
  dismissLabel,
  openingLabel,
}: {
  notification: Notification;
  locale: string;
  canNavigate: boolean;
  opening: boolean;
  onOpen: (n: Notification) => void;
  onDismiss: (e: React.MouseEvent, ids: number[]) => void;
  dismissLabel: string;
  openingLabel: string;
}) {
  return (
    <div
      className={`relative ${canNavigate && !opening ? "cursor-pointer" : ""} ${opening ? "pointer-events-none" : ""}`}
      onClick={canNavigate && !opening ? () => onOpen(n) : undefined}
      onKeyDown={
        canNavigate && !opening
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(n);
              }
            }
          : undefined
      }
      role={canNavigate && !opening ? "button" : undefined}
      tabIndex={canNavigate && !opening ? 0 : undefined}
    >
      <Card
        hover={canNavigate && !opening}
        className={`p-4 transition-all sm:p-5 ${opening ? "ring-2 ring-blue-300 bg-blue-50/40" : "ring-2 ring-blue-100"}`}
      >
        {opening && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/80 backdrop-blur-[2px]">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-600" />
            </div>
            <p className="text-xs font-semibold text-blue-700">{openingLabel}</p>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              <p className="font-semibold text-slate-900">{n.title}</p>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{n.body}</p>
            <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.created_at, locale)}</p>
          </div>
          {!opening && (
            <Button variant="ghost" size="sm" className="w-full shrink-0 sm:w-auto" onClick={(e) => onDismiss(e, [n.id])}>
              {dismissLabel}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export function NotificationsList() {
  const { t, locale } = useTranslation();
  const { recent, loading, unreadCount, markRead, markAllRead } = useNotifications();
  const { openNotification, getHref } = useNotificationNavigation();
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [dismissing, setDismissing] = useState(false);

  async function handleDismiss(e: React.MouseEvent, ids: number[]) {
    e.stopPropagation();
    setDismissing(true);
    try {
      await markRead(ids);
    } finally {
      setDismissing(false);
    }
  }

  async function handleOpen(n: Notification) {
    if (!getHref(n) || openingId !== null) return;
    setOpeningId(n.id);
    try {
      await openNotification(n);
    } finally {
      setOpeningId(null);
    }
  }

  if (loading && recent.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (dismissing && recent.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <LoadingSpinner />
        <p className="text-sm text-slate-500">{t("notifications.dismissing")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && !openingId && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={markAllRead} disabled={dismissing}>
            {t("notifications.markAllRead")}
          </Button>
        </div>
      )}

      {recent.length === 0 && !openingId && (
        <Card className="p-12 text-center">
          <p className="text-sm font-medium text-slate-600">{t("notifications.empty")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("notifications.emptyHint")}</p>
        </Card>
      )}

      <div className="space-y-3">
        {recent.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            locale={locale}
            canNavigate={!!getHref(n)}
            opening={openingId === n.id}
            onOpen={handleOpen}
            onDismiss={handleDismiss}
            dismissLabel={t("notifications.dismiss")}
            openingLabel={t("notifications.opening")}
          />
        ))}
      </div>
    </div>
  );
}
