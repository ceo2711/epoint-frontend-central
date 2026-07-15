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
import { MerchantFormModal } from "@/features/merchants/components/MerchantFormModal";
import { MerchantsTable } from "@/features/merchants/components/MerchantsTable";
import { useMerchants } from "@/features/merchants/hooks/useMerchants";
import type { Merchant } from "@/features/merchants/types";
import { api } from "@/lib/api";

export default function MerchantsPage() {
  const { token, hasPermission, refreshUser } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const { merchants, loading, error, reload } = useMerchants(
    token,
    hasPermission("merchants:create"),
    t("merchants.loadError"),
    t("merchants.noPermission"),
    true,
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Merchant | null>(null);

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

  return (
    <>
      <Header
        title={t("merchants.headerContext")}
        subtitle={t("merchants.subtitle")}
        actions={
          hasPermission("merchants:create") ? (
            <Button size="sm" onClick={openCreate}>
              {t("merchants.add")}
            </Button>
          ) : undefined
        }
      />
      <PageContent>
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
