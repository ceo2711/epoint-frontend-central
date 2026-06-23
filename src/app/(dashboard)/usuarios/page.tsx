"use client";

import { FormEvent, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAreas } from "@/features/areas/hooks/useAreas";
import { useRoles } from "@/features/roles/hooks/useRoles";
import { UserForm } from "@/features/users/components/UserForm";
import { UsersTable } from "@/features/users/components/UsersTable";
import { useUsers } from "@/features/users/hooks/useUsers";
import { EMPTY_USER_FORM, type User, type UserFormData } from "@/features/users/types";
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
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_USER_FORM);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_USER_FORM);
    setShowForm(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone ?? "",
      role_id: String(user.role.id),
      area_id: user.area ? String(user.area.id) : "",
      is_active: user.is_active,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(
          `/users/${editing.id}`,
          {
            email: form.email,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone || null,
            role_id: Number(form.role_id),
            area_id: form.area_id ? Number(form.area_id) : null,
            is_active: form.is_active,
          },
          token,
        );
      } else {
        await api.post(
          "/users",
          {
            email: form.email,
            password: form.password,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone || null,
            role_id: Number(form.role_id),
            area_id: form.area_id ? Number(form.area_id) : null,
          },
          token,
        );
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_USER_FORM);
      await reload();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("common.error"),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
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
        message: err instanceof ApiError ? err.message : t("common.error"),
        variant: "error",
      });
    }
  }

  return (
    <>
      <Header
        title={t("users.headerContext")}
        subtitle={t("users.subtitle")}
        actions={
          hasPermission("users:create") ? (
            <Button size="sm" onClick={() => (showForm ? setShowForm(false) : openCreate())}>
              {showForm ? t("common.cancel") : t("users.add")}
            </Button>
          ) : undefined
        }
      />
      <PageContent>
        {showForm && hasPermission(editing ? "users:update" : "users:create") && (
          <UserForm
            form={form}
            roles={roles}
            areas={areas}
            onChange={setForm}
            onSubmit={handleSubmit}
            submitting={submitting}
            isEdit={!!editing}
          />
        )}
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
    </>
  );
}
