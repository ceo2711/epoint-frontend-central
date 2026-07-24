"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
import type { Sede } from "@/features/sedes/types";
import { UserForm } from "@/features/users/components/UserForm";
import {
  AREA_REQUIRED_ROLE_CODES,
  EMPTY_USER_FORM,
  SEDE_REQUIRED_ROLE_CODES,
  type User,
  type UserFormData,
} from "@/features/users/types";
import { api } from "@/lib/api";

interface UserFormModalProps {
  token: string | null;
  roles: Role[];
  areas: Area[];
  sedes: Sede[];
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
    sede_id: user.sede_id != null ? String(user.sede_id) : "",
    is_active: user.is_active,
  };
}

export function UserFormModal({
  token,
  roles,
  areas,
  sedes,
  user,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const { user: currentUser, refreshUser } = useAuth();
  const isEdit = !!user;
  const isBranchManager = currentUser?.role.code === "BRANCH_MANAGER";
  const showSedeSelect = currentUser?.role.code === "ADMIN";

  const assignableRoles = useMemo(() => {
    if (isBranchManager) {
      return roles.filter((r) =>
        SEDE_REQUIRED_ROLE_CODES.includes(r.code as (typeof SEDE_REQUIRED_ROLE_CODES)[number]) &&
        r.code !== "BRANCH_MANAGER",
      );
    }
    return roles;
  }, [roles, isBranchManager]);

  const [form, setForm] = useState<UserFormData>(user ? userToForm(user) : EMPTY_USER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url ?? null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const displayAvatarUrl = pendingPreviewUrl ?? avatarUrl;

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  function setPendingAvatar(file: File | null) {
    setPendingPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
    setPendingAvatarFile(file);
  }

  async function syncAfterAvatarChange(updated: User) {
    setAvatarUrl(updated.avatar_url ?? null);
    setPendingAvatar(null);
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

  function handleFileSelected(file: File) {
    if (isEdit && user) {
      void handleUploadAvatar(file);
      return;
    }
    setPendingAvatar(file);
  }

  function handleRemoveClick() {
    if (isEdit && user) {
      if (pendingPreviewUrl) {
        setPendingAvatar(null);
        return;
      }
      void handleRemoveAvatar();
      return;
    }
    setPendingAvatar(null);
  }

  function buildPayload(includePassword: boolean) {
    const selectedRole = assignableRoles.find((r) => String(r.id) === form.role_id);
    const sedeRequired =
      !!selectedRole &&
      SEDE_REQUIRED_ROLE_CODES.includes(selectedRole.code as (typeof SEDE_REQUIRED_ROLE_CODES)[number]);
    const areaRequired =
      !!selectedRole &&
      AREA_REQUIRED_ROLE_CODES.includes(selectedRole.code as (typeof AREA_REQUIRED_ROLE_CODES)[number]);

    const payload: Record<string, unknown> = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      role_id: Number(form.role_id),
      area_id: form.area_id ? Number(form.area_id) : null,
    };

    if (areaRequired && !form.area_id) {
      throw new Error(t("users.areaRequired"));
    }

    if (showSedeSelect) {
      payload.sede_id = sedeRequired && form.sede_id ? Number(form.sede_id) : null;
    }

    if (includePassword && form.password.trim()) {
      payload.password = form.password;
    }

    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      if (isEdit && user) {
        const payload = buildPayload(true);
        payload.is_active = form.is_active;
        await api.patch(`/users/${user.id}`, payload, token);
      } else {
        const created = await api.post<User>(
          "/users",
          {
            ...buildPayload(false),
            password: form.password,
          },
          token,
        );
        if (pendingAvatarFile) {
          const formData = new FormData();
          formData.append("file", pendingAvatarFile);
          await api.upload<User>(`/users/${created.id}/avatar`, formData, token);
        }
      }
      setPendingAvatar(null);
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

  const hasAvatar = Boolean(displayAvatarUrl);
  const avatarActionLabel = hasAvatar
    ? avatarBusy
      ? t("account.avatarUploading")
      : t("account.avatarChange")
    : t("account.avatarAdd");

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
          <Button type="submit" form="user-form-modal" disabled={submitting || avatarBusy}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-100 bg-cream-50/80 px-4 py-3">
        <input
          ref={avatarFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={avatarBusy || submitting}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFileSelected(file);
          }}
        />
        <UserAvatar
          firstName={form.first_name || user?.first_name || "?"}
          lastName={form.last_name || user?.last_name || ""}
          avatarUrl={displayAvatarUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{t("account.avatarTitle")}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t("account.avatarFormats")}</p>
          <div className="mt-2 flex items-center gap-2">
            <IconActionButton
              label={avatarActionLabel}
              icon={<HiOutlineCamera className="h-4 w-4" />}
              variant="primary"
              disabled={avatarBusy || submitting}
              onClick={() => avatarFileRef.current?.click()}
            />
            {hasAvatar ? (
              <IconActionButton
                label={
                  avatarBusy && isEdit ? t("account.avatarRemoving") : t("account.avatarRemove")
                }
                icon={<HiOutlineTrash className="h-4 w-4" />}
                variant="danger"
                disabled={avatarBusy || submitting}
                onClick={handleRemoveClick}
              />
            ) : null}
          </div>
        </div>
      </div>

      <UserForm
        embedded
        formId="user-form-modal"
        form={form}
        roles={assignableRoles}
        areas={areas}
        sedes={sedes}
        showSedeSelect={showSedeSelect}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEdit={isEdit}
      />
    </Modal>
  );
}
