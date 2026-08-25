"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { CourseCatalog } from "@/features/courses/components/CourseCatalog";
import { useTranslation } from "@/contexts/LanguageContext";

export default function StaffCursosPage() {
  const router = useRouter();
  const { user, hasPermission, isLoading } = useAuth();
  const { t } = useTranslation();
  const canManage = hasPermission("courses:manage");

  useEffect(() => {
    if (!isLoading && user && !canManage) {
      router.replace("/dashboard");
    }
  }, [canManage, isLoading, router, user]);

  if (!canManage) return null;

  return (
    <>
      <Header title={t("nav.courses")} subtitle={t("courses.manageSubtitle")} />
      <PageContent>
        <CourseCatalog mode="manage" />
      </PageContent>
    </>
  );
}
