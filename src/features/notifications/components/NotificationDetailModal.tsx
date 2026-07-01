"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatDateTime } from "@/lib/format-datetime";
import type { Notification } from "@/types/api";

interface NotificationDetailModalProps {
  notification: Notification;
  canNavigate: boolean;
  onNavigate: () => void;
  onClose: () => void;
}

export function NotificationDetailModal({
  notification,
  canNavigate,
  onNavigate,
  onClose,
}: NotificationDetailModalProps) {
  const { t, locale } = useTranslation();

  return (
    <Modal
      title={notification.title}
      subtitle={formatDateTime(notification.created_at, locale)}
      onClose={onClose}
      size="md"
      footer={
        canNavigate ? (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t("common.close")}
            </Button>
            <Button onClick={onNavigate}>{t("notifications.openRelated")}</Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={onClose}>{t("common.close")}</Button>
          </div>
        )
      }
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{notification.body}</p>
    </Modal>
  );
}
