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
import { MerchantFormModal } from "@/features/merchants/components/MerchantFormModal";
import { MerchantsTable } from "@/features/merchants/components/MerchantsTable";
import { useMerchants } from "@/features/merchants/hooks/useMerchants";
import type { Merchant } from "@/features/merchants/types";
import { api } from "@/lib/api";
import { canManageMerchants } from "@/lib/roles";

export default function MerchantsPage() {
  const router = useRouter();
  const { token, hasPermission, refreshUser, user } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const canAccess = canManageMerchants(user?.role.code);
  const { merchants, loading, error, reload } = useMerchants(
    token,
    canAccess && hasPermission("merchants:read"),
    t("merchants.loadError"),
    t("merchants.noPermission"),
    true,
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Merchant | null>(null);

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  function openCreate() {
    setEditing(null);
    setModalMode("create");
  }

  function openEdit(merchant: Merchant) {
    setEditing(merchant);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  async function handleReactivate(merchant: Merchant) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("merchants.reactivateTitle"),
      message: t("merchants.reactivateConfirm", { name: merchant.name }),
      confirmLabel: t("merchants.reactivate"),
    });
    if (!confirmed) return;
    try {
      await api.patch(`/merchants/${merchant.id}`, { is_active: true }, token);
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

  async function handleDelete(merchant: Merchant) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("merchants.deleteTitle"),
      message: t("merchants.deleteConfirm", { name: merchant.name }),
      confirmLabel: t("merchants.delete"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.post(`/merchants/${merchant.id}/purge`, {}, token);
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

  async function handleDeactivate(merchant: Merchant) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("merchants.deactivateTitle"),
      message: t("merchants.deactivateConfirm", { name: merchant.name }),
      confirmLabel: t("merchants.deactivate"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/merchants/${merchant.id}`, token);
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
      <Header title={t("merchants.headerContext")} subtitle={t("merchants.subtitle")} />
      <PageContent>
        {hasPermission("merchants:create") ? (
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={openCreate}>
              {t("merchants.add")}
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
          <MerchantsTable
            merchants={merchants}
            canUpdate={hasPermission("merchants:update")}
            canDelete={hasPermission("merchants:delete")}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onDelete={handleDelete}
          />
        )}
      </PageContent>

      {modalMode && hasPermission(modalMode === "edit" ? "merchants:update" : "merchants:create") ? (
        <MerchantFormModal
          token={token}
          merchant={modalMode === "edit" ? editing : null}
          onClose={closeModal}
          onSuccess={() => void reload()}
        />
      ) : null}
    </>
  );
}
