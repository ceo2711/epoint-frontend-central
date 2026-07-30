"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import { InfluencerFormModal } from "@/features/influencers/components/InfluencerFormModal";
import { InfluencersTable } from "@/features/influencers/components/InfluencersTable";
import { useInfluencers } from "@/features/influencers/hooks/useInfluencers";
import type { Influencer } from "@/features/influencers/types";
import { api } from "@/lib/api";
import { canManageInfluencers } from "@/lib/roles";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

export default function InfluencersPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const canAccess = canManageInfluencers(user);

  const { influencers, loading, error, reload } = useInfluencers(
    token,
    canAccess,
    t("influencers.loadError"),
    t("influencers.noPermission"),
    true,
  );

  const { salesReps } = useSalesReps(token, !!token && canAccess);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Influencer | null>(null);

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  function openCreate() {
    setEditing(null);
    setModalMode("create");
  }

  function openEdit(influencer: Influencer) {
    setEditing(influencer);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  async function handleReactivate(influencer: Influencer) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("influencers.reactivateTitle"),
      message: t("influencers.reactivateConfirm", { name: influencer.name }),
      confirmLabel: t("influencers.reactivate"),
    });
    if (!confirmed) return;
    try {
      await api.patch(`/influencers/${influencer.id}`, { is_active: true }, token);
      await reload();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  async function handleDeactivate(influencer: Influencer) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("influencers.deactivateTitle"),
      message: t("influencers.deactivateConfirm", { name: influencer.name }),
      confirmLabel: t("influencers.deactivate"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/influencers/${influencer.id}`, token);
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
      <Header title={t("influencers.headerContext")} subtitle={t("influencers.subtitle")} />
      <PageContent>
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={openCreate}>
            {t("influencers.add")}
          </Button>
        </div>
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && (
          <InfluencersTable
            influencers={influencers}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        )}
      </PageContent>

      {modalMode && (
        <InfluencerFormModal
          token={token}
          influencer={modalMode === "edit" ? editing : null}
          salesReps={salesReps}
          onClose={closeModal}
          onSuccess={() => {
            void reload();
          }}
        />
      )}
    </>
  );
}
