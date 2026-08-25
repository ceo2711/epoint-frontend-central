"use client";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import { CourseCatalog } from "@/features/courses/components/CourseCatalog";

export default function PortalCursosPage() {
  const { t } = useTranslation();

  return (
    <>
      <Header title={t("nav.courses")} subtitle={t("courses.watchSubtitle")} />
      <PageContent>
        <CourseCatalog mode="watch" />
      </PageContent>
    </>
  );
}
