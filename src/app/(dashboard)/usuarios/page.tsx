"use client";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { UsersTable } from "@/features/users/components/UsersTable";
import { useUsers } from "@/features/users/hooks/useUsers";

export default function UsuariosPage() {
  const { token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const { users, loading, error } = useUsers(
    token,
    hasPermission("users:read"),
    t("users.loadError"),
    t("users.noPermission"),
  );

  return (
    <>
      <Header title={t("users.headerContext")} subtitle={t("users.subtitle")} />
      <PageContent>
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && <UsersTable users={users} />}
      </PageContent>
    </>
  );
}
