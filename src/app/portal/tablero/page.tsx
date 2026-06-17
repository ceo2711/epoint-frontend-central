"use client";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { ClientBoardPanel } from "@/features/boards/components/ClientBoardPanel";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";

export default function PortalTableroPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();

  return (
    <>
      <Header title={t("portalBoard.headerContext")} subtitle={t("portalBoard.subtitle")} />
      <PageContent>
        <ClientBoardPanel token={token} clientId={user?.client_id} isClientPortal />
      </PageContent>
    </>
  );
}
