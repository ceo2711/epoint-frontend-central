"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useEffect, useRef, useState } from "react";
import { HiOutlineCamera, HiOutlineTrash } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SedeForm } from "@/features/sedes/components/SedeForm";
import { EMPTY_SEDE_FORM, type Sede, type SedeFormData } from "@/features/sedes/types";
import { api } from "@/lib/api";

interface SedeFormModalProps {
  token: string | null;
  sede?: Sede | null;
  onClose: () => void;
  onSuccess: () => void;
}

function sedeToForm(sede: Sede): SedeFormData {
  return {
    code: sede.code,
    name: sede.name,
    description: sede.description ?? "",
  };
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function SedeFormModal({ token, sede, onClose, onSuccess }: SedeFormModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const isEdit = !!sede;
  const [form, setForm] = useState<SedeFormData>(sede ? sedeToForm(sede) : EMPTY_SEDE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(sede?.avatar_url ?? null);
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

  async function syncAfterAvatarChange(updated: Sede) {
    setAvatarUrl(updated.avatar_url ?? null);
    setPendingAvatar(null);
    onSuccess();
  }

  async function handleUploadAvatar(file: File) {
    if (!token || !sede) return;
    setAvatarBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await api.upload<Sede>(`/sedes/${sede.id}/avatar`, formData, token);
      await syncAfterAvatarChange(updated);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("sedes.avatarError")),
        variant: "error",
      });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!token || !sede) return;
    setAvatarBusy(true);
    try {
      const updated = await api.delete<Sede>(`/sedes/${sede.id}/avatar`, token);
      await syncAfterAvatarChange(updated);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("sedes.avatarError")),
        variant: "error",
      });
    } finally {
      setAvatarBusy(false);
    }
  }

  function handleFileSelected(file: File) {
    if (isEdit && sede) {
      void handleUploadAvatar(file);
      return;
    }
    setPendingAvatar(file);
  }

  function handleRemoveClick() {
    if (isEdit && sede) {
      if (pendingPreviewUrl) {
        setPendingAvatar(null);
        return;
      }
      void handleRemoveAvatar();
      return;
    }
    setPendingAvatar(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      if (isEdit && sede) {
        await api.patch(
          `/sedes/${sede.id}`,
          { name: form.name, description: form.description || null },
          token,
        );
      } else {
        const created = await api.post<Sede>(
          "/sedes",
          { code: form.code, name: form.name, description: form.description || null },
          token,
        );
        if (pendingAvatarFile) {
          const formData = new FormData();
          formData.append("file", pendingAvatarFile);
          await api.upload<Sede>(`/sedes/${created.id}/avatar`, formData, token);
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
      ? t("sedes.avatarUploading")
      : t("sedes.avatarChange")
    : t("sedes.avatarAdd");

  return (
    <Modal
      title={isEdit ? t("sedes.edit") : t("sedes.new")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="sede-form-modal" disabled={submitting || avatarBusy}>
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
        {displayAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayAvatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-slate-200"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand ring-2 ring-slate-200">
            {initialsFor(form.name || sede?.name || "?")}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{t("sedes.avatarTitle")}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t("sedes.avatarFormats")}</p>
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
                  avatarBusy && isEdit ? t("sedes.avatarRemoving") : t("sedes.avatarRemove")
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

      <SedeForm
        embedded
        formId="sede-form-modal"
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEdit={isEdit}
      />
    </Modal>
  );
}
