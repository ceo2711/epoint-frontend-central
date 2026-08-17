"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Card, PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ClientBoardPanel } from "@/features/boards/components/ClientBoardPanel";
import { useAuth } from "@/features/auth/AuthContext";
import { usePortalBoardUnlocked } from "@/features/portal/components/PortalBoardUnlockGate";
import { usePortalMe } from "@/features/portal/hooks/usePortalWorkspace";
import { payloadPositiveInt } from "@/features/notifications/notification-routes";
import { useTranslation } from "@/contexts/LanguageContext";

export default function PortalTableroPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <>
          <Header title={t("portalBoard.headerContext")} subtitle={t("portalBoard.subtitle")} />
          <PageContent>
            <LoadingSpinner label={t("portalBoard.loading")} />
          </PageContent>
        </>
      }
    >
      <PortalTableroPageContent />
    </Suspense>
  );
}

function PortalTableroPageContent() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: client, isLoading } = usePortalMe(token);
  const boardUnlocked = usePortalBoardUnlocked();
  const initialCardId = payloadPositiveInt(searchParams.get("card"));

  useEffect(() => {
    if (!isLoading && client && !boardUnlocked) {
      router.replace("/portal");
    }
  }, [isLoading, client, boardUnlocked, router]);

  if (isLoading || !client) {
    return (
      <>
        <Header title={t("portalBoard.headerContext")} subtitle={t("portalBoard.subtitle")} />
        <PageContent>
          <LoadingSpinner label={t("portalBoard.loading")} />
        </PageContent>
      </>
    );
  }

  if (!boardUnlocked) {
    return (
      <>
        <Header title={t("portalBoard.headerContext")} subtitle={t("portalBoard.subtitle")} />
        <PageContent>
          <Card className="p-6">
            <p className="text-sm text-slate-600">{t("portalBoard.unavailable")}</p>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <Header title={t("portalBoard.headerContext")} subtitle={t("portalBoard.subtitle")} />
      <PageContent>
        <ClientBoardPanel
          token={token}
          clientId={user?.client_id}
          isClientPortal
          initialCardId={initialCardId}
        />
      </PageContent>
    </>
  );
}
