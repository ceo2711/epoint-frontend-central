"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SourceFormModal } from "@/features/sources/components/SourceFormModal";
import { SourcesTable } from "@/features/sources/components/SourcesTable";
import { useSources } from "@/features/sources/hooks/useSources";
import type { Source } from "@/features/sources/types";
import { api } from "@/lib/api";
import { canManageSources } from "@/lib/roles";

export default function SourcesPage() {
  const router = useRouter();
  const { token, hasPermission, refreshUser, user } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const canAccess = canManageSources(user?.role.code);
  const { sources, loading, error, reload } = useSources(
    token,
    canAccess && hasPermission("sources:read"),
    t("sources.loadError"),
    t("sources.noPermission"),
    true,
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Source | null>(null);

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  function openCreate() {
    setEditing(null);
    setModalMode("create");
  }

  function openEdit(source: Source) {
    setEditing(source);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  async function handleReactivate(source: Source) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("sources.reactivateTitle"),
      message: t("sources.reactivateConfirm", { name: source.name }),
      confirmLabel: t("sources.reactivate"),
    });
    if (!confirmed) return;
    try {
      await api.patch(`/sources/${source.id}`, { is_active: true }, token);
      await reload();
      await refreshUser();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  async function handleDeactivate(source: Source) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("sources.deactivateTitle"),
      message: t("sources.deactivateConfirm", { name: source.name }),
      confirmLabel: t("sources.deactivate"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/sources/${source.id}`, token);
      await reload();
      await refreshUser();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  if (!canAccess) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Header title={t("sources.headerContext")} subtitle={t("sources.subtitle")} />
      <PageContent>
        {hasPermission("sources:create") ? (
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={openCreate}>
              {t("sources.add")}
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
          <SourcesTable
            sources={sources}
            canUpdate={hasPermission("sources:update")}
            canDelete={hasPermission("sources:delete")}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        )}
      </PageContent>

      {modalMode && (
        <SourceFormModal
          token={token}
          source={modalMode === "edit" ? editing : null}
          onClose={closeModal}
          onSuccess={() => {
            void reload();
            void refreshUser();
          }}
        />
      )}
    </>
  );
}
