"use client";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { AreasGrid } from "@/features/areas/components/AreasGrid";
import { useAreas } from "@/features/areas/hooks/useAreas";

export default function AreasPage() {
  const { token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const { areas, loading, error } = useAreas(
    token,
    hasPermission("areas:read"),
    t("areas.loadError"),
    t("areas.noPermission"),
  );

  return (
    <>
      <Header title={t("areas.title")} subtitle={t("areas.subtitle")} />
      <PageContent>
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && <AreasGrid areas={areas} />}
      </PageContent>
    </>
  );
}
