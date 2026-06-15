"use client";

import { Header } from "@/components/layout/Header";
import { NotificationsList } from "@/features/notifications/components/NotificationsList";
import { PageContent } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";

export default function PortalNotificacionesPage() {
  const { t } = useTranslation();

  return (
    <>
      <Header title={t("notifications.title")} subtitle={t("notifications.subtitle")} />
      <PageContent>
        <NotificationsList />
      </PageContent>
    </>
  );
}
