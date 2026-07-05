"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Area } from "@/features/areas/types";
import type { Role } from "@/features/roles/types";
import { UserForm } from "@/features/users/components/UserForm";
import { EMPTY_USER_FORM, type User, type UserFormData } from "@/features/users/types";
import { ApiError, api } from "@/lib/api";

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
  const isEdit = !!user;
  const [form, setForm] = useState<UserFormData>(user ? userToForm(user) : EMPTY_USER_FORM);
  const [submitting, setSubmitting] = useState(false);

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
        message: err instanceof ApiError ? err.message : t("common.error"),
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
