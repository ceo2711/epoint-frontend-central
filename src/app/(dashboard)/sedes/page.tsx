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
import { SedeDetailModal } from "@/features/sedes/components/SedeDetailModal";
import { SedeFormModal } from "@/features/sedes/components/SedeFormModal";
import { SedesTable } from "@/features/sedes/components/SedesTable";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import type { Sede } from "@/features/sedes/types";
import { api } from "@/lib/api";
import { canManageSedes } from "@/lib/roles";

export default function SedesPage() {
  const router = useRouter();
  const { token, hasPermission, user } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const canAccess = canManageSedes(user?.role.code);
  const { sedes, loading, error, reload } = useSedes(
    token,
    canAccess && (hasPermission("sedes:read") || hasPermission("sedes:create")),
    t("sedes.loadError"),
    t("sedes.noPermission"),
    true,
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Sede | null>(null);
  const [viewing, setViewing] = useState<Sede | null>(null);

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  function openCreate() {
    setViewing(null);
    setEditing(null);
    setModalMode("create");
  }

  function openDetail(sede: Sede) {
    setViewing(sede);
  }

  function openEdit(sede: Sede) {
    setViewing(null);
    setEditing(sede);
    setModalMode("edit");
  }

  function closeFormModal() {
    setModalMode(null);
    setEditing(null);
  }

  function closeDetailModal() {
    setViewing(null);
  }

  async function handleReactivate(sede: Sede) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("sedes.reactivateTitle"),
      message: t("sedes.reactivateConfirm", { name: sede.name }),
      confirmLabel: t("sedes.reactivate"),
    });
    if (!confirmed) return;
    try {
      await api.patch(`/sedes/${sede.id}`, { is_active: true }, token);
      setViewing(null);
      await reload();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  async function handleDeactivate(sede: Sede) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("sedes.deactivateTitle"),
      message: t("sedes.deactivateConfirm", { name: sede.name }),
      confirmLabel: t("sedes.deactivate"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/sedes/${sede.id}`, token);
      setViewing(null);
      await reload();
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
      <Header title={t("sedes.headerContext")} subtitle={t("sedes.subtitle")} />
      <PageContent>
        {hasPermission("sedes:create") ? (
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={openCreate}>
              {t("sedes.add")}
            </Button>
          </div>
        ) : null}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : null}
        {error ? <div className="alert alert-error">{error}</div> : null}
        {!loading && !error ? (
          <SedesTable
            sedes={sedes}
            canUpdate={hasPermission("sedes:update")}
            canDelete={hasPermission("sedes:delete")}
            onSelect={openDetail}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        ) : null}
      </PageContent>

      {viewing ? (
        <SedeDetailModal
          sede={viewing}
          canUpdate={hasPermission("sedes:update")}
          canDelete={hasPermission("sedes:delete")}
          onClose={closeDetailModal}
          onEdit={openEdit}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />
      ) : null}

      {modalMode && hasPermission(modalMode === "edit" ? "sedes:update" : "sedes:create") ? (
        <SedeFormModal
          token={token}
          sede={modalMode === "edit" ? editing : null}
          onClose={closeFormModal}
          onSuccess={() => void reload()}
        />
      ) : null}
    </>
  );
}
