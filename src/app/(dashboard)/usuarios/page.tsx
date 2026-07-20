"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAreas } from "@/features/areas/hooks/useAreas";
import { useRoles } from "@/features/roles/hooks/useRoles";
import { UserFormModal } from "@/features/users/components/UserFormModal";
import { UsersTable } from "@/features/users/components/UsersTable";
import { useUsers } from "@/features/users/hooks/useUsers";
import type { User } from "@/features/users/types";
import { ApiError, api } from "@/lib/api";

export default function UsuariosPage() {
  const { token, hasPermission, user: currentUser } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const { users, loading, error, reload } = useUsers(
    token,
    hasPermission("users:read"),
    t("users.loadError"),
    t("users.noPermission"),
  );
  const { roles } = useRoles(token, hasPermission("roles:read"), "", "");
  const { areas } = useAreas(token, hasPermission("areas:read"), "", "");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<User | null>(null);

  function openCreate() {
    setEditing(null);
    setModalMode("create");
  }

  function openEdit(user: User) {
    setEditing(user);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  async function handleDeactivate(user: User) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("users.deactivateTitle"),
      message: t("users.deactivateConfirm", { name: `${user.first_name} ${user.last_name}` }),
      confirmLabel: t("users.deactivate"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/users/${user.id}`, token);
      await reload();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  return (
    <>
      <Header title={t("users.headerContext")} subtitle={t("users.subtitle")} />
      <PageContent>
        {hasPermission("users:create") ? (
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={openCreate}>
              {t("users.add")}
            </Button>
          </div>
        ) : null}
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && (
          <UsersTable
            users={users}
            currentUserId={currentUser?.id}
            canUpdate={hasPermission("users:update")}
            canDelete={hasPermission("users:delete")}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
          />
        )}
      </PageContent>

      {modalMode && hasPermission(modalMode === "edit" ? "users:update" : "users:create") ? (
        <UserFormModal
          token={token}
          roles={roles}
          areas={areas}
          user={modalMode === "edit" ? editing : null}
          onClose={closeModal}
          onSuccess={() => void reload()}
        />
      ) : null}
    </>
  );
}
