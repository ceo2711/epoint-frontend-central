"use client";

import { Header } from "@/components/layout/Header";
import { Card, PageContent } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";

export default function PortalMentoriasPage() {
  const { t } = useTranslation();

  return (
    <>
      <Header title={t("nav.mentorships")} subtitle={t("portal.mentorshipSoon")} />
      <PageContent>
        <Card className="p-6">
          <p className="text-slate-600">{t("portal.mentorshipSoon")}</p>
        </Card>
      </PageContent>
    </>
  );
}
