"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { RolesList } from "@/features/roles/components/RolesList";
import { useRoles } from "@/features/roles/hooks/useRoles";
import { isGlobalAdmin } from "@/lib/roles";

export default function RolesPage() {
  const router = useRouter();
  const { token, hasPermission, user } = useAuth();
  const { t } = useTranslation();
  const canAccess = isGlobalAdmin(user?.role.code) && hasPermission("roles:read");
  const { roles, loading, error } = useRoles(
    token,
    canAccess,
    t("roles.loadError"),
    t("roles.noPermission"),
  );

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  if (!canAccess) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Header title={t("roles.headerContext")} subtitle={t("roles.subtitle")} />
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
