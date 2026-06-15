"use client";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { RolesList } from "@/features/roles/components/RolesList";
import { useRoles } from "@/features/roles/hooks/useRoles";

export default function RolesPage() {
  const { token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const { roles, loading, error } = useRoles(
    token,
    hasPermission("roles:read"),
    t("roles.loadError"),
    t("roles.noPermission"),
  );

  return (
    <>
      <Header title={t("roles.title")} subtitle={t("roles.subtitle")} />
      <PageContent>
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && <RolesList roles={roles} />}
      </PageContent>
    </>
  );
}
