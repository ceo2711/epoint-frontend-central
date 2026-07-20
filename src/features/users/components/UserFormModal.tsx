"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useRef, useState } from "react";
import { HiOutlineCamera, HiOutlineTrash } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { Modal } from "@/components/ui/Modal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Area } from "@/features/areas/types";
import type { Role } from "@/features/roles/types";
import { UserForm } from "@/features/users/components/UserForm";
import { EMPTY_USER_FORM, type User, type UserFormData } from "@/features/users/types";
import { api } from "@/lib/api";

interface UserFormModalProps {
  token: string | null;
  roles: Role[];
  areas: Area[];
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

function userToForm(user: User): UserFormData {
  return {
    email: user.email,
    password: "",
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone ?? "",
    role_id: String(user.role.id),
    area_id: user.area ? String(user.area.id) : "",
    is_active: user.is_active,
  };
}

export function UserFormModal({
  token,
  roles,
  areas,
  user,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const { user: currentUser, refreshUser } = useAuth();
  const isEdit = !!user;
  const [form, setForm] = useState<UserFormData>(user ? userToForm(user) : EMPTY_USER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url ?? null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  async function syncAfterAvatarChange(updated: User) {
    setAvatarUrl(updated.avatar_url ?? null);
    onSuccess();
    if (user && currentUser?.id === user.id) {
      await refreshUser();
    }
  }

  async function handleUploadAvatar(file: File) {
    if (!token || !user) return;
    setAvatarBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await api.upload<User>(`/users/${user.id}/avatar`, formData, token);
      await syncAfterAvatarChange(updated);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("account.avatarError")),
        variant: "error",
      });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!token || !user) return;
    setAvatarBusy(true);
    try {
      const updated = await api.delete<User>(`/users/${user.id}/avatar`, token);
      await syncAfterAvatarChange(updated);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("account.avatarError")),
        variant: "error",
      });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      if (isEdit && user) {
        const payload: Record<string, unknown> = {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || null,
          role_id: Number(form.role_id),
          area_id: form.area_id ? Number(form.area_id) : null,
          is_active: form.is_active,
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await api.patch(`/users/${user.id}`, payload, token);
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
      onSuccess();
      onClose();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={isEdit ? t("users.edit") : t("users.new")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="user-form-modal" disabled={submitting}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      }
    >
      {isEdit && user ? (
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-100 bg-cream-50/80 px-4 py-3">
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={avatarBusy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleUploadAvatar(file);
            }}
          />
          <UserAvatar
            firstName={form.first_name || user.first_name}
            lastName={form.last_name || user.last_name}
            avatarUrl={avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{t("account.avatarTitle")}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t("account.avatarFormats")}</p>
            <div className="mt-2 flex items-center gap-2">
              <IconActionButton
                label={avatarBusy ? t("account.avatarUploading") : t("account.avatarChange")}
                icon={<HiOutlineCamera className="h-4 w-4" />}
                variant="primary"
                disabled={avatarBusy || submitting}
                onClick={() => avatarFileRef.current?.click()}
              />
              {avatarUrl ? (
                <IconActionButton
                  label={avatarBusy ? t("account.avatarRemoving") : t("account.avatarRemove")}
                  icon={<HiOutlineTrash className="h-4 w-4" />}
                  variant="danger"
                  disabled={avatarBusy || submitting}
                  onClick={() => void handleRemoveAvatar()}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <UserForm
        embedded
        formId="user-form-modal"
        form={form}
        roles={roles}
        areas={areas}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEdit={isEdit}
      />
    </Modal>
  );
}
