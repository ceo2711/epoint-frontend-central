"use client";

import { FormEvent, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { MerchantForm } from "@/features/merchants/components/MerchantForm";
import { MerchantsTable } from "@/features/merchants/components/MerchantsTable";
import { useMerchants } from "@/features/merchants/hooks/useMerchants";
import { EMPTY_MERCHANT_FORM, type Merchant, type MerchantFormData } from "@/features/merchants/types";
import { ApiError, api } from "@/lib/api";

export default function MerchantsPage() {
  const { token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const { merchants, loading, error, reload } = useMerchants(
    token,
    hasPermission("merchants:create"),
    t("merchants.loadError"),
    t("merchants.noPermission"),
    true,
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [form, setForm] = useState<MerchantFormData>(EMPTY_MERCHANT_FORM);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_MERCHANT_FORM);
    setShowForm(true);
  }

  function openEdit(merchant: Merchant) {
    setEditing(merchant);
    setForm({
      code: merchant.code,
      name: merchant.name,
      description: merchant.description ?? "",
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
          `/merchants/${editing.id}`,
          { name: form.name, description: form.description || null },
          token,
        );
      } else {
        await api.post(
          "/merchants",
          { code: form.code, name: form.name, description: form.description || null },
          token,
        );
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_MERCHANT_FORM);
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
        title={t("merchants.headerContext")}
        subtitle={t("merchants.subtitle")}
        actions={
          hasPermission("merchants:create") ? (
            <Button size="sm" onClick={() => (showForm ? setShowForm(false) : openCreate())}>
              {showForm ? t("common.cancel") : t("merchants.add")}
            </Button>
          ) : undefined
        }
      />
      <PageContent>
        {showForm && hasPermission(editing ? "merchants:update" : "merchants:create") && (
          <MerchantForm
            form={form}
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
          <MerchantsTable
            merchants={merchants}
            canUpdate={hasPermission("merchants:update")}
            canDelete={hasPermission("merchants:delete")}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
          />
        )}
      </PageContent>
    </>
  );
}
