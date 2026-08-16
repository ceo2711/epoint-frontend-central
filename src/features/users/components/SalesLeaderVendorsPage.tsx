"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { ReassignSubSellerModal } from "@/features/users/components/ReassignSubSellerModal";
import { api } from "@/lib/api";
import { invalidateStaffDirectoryCaches } from "@/lib/invalidateStaffCaches";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import type { User } from "@/types/api";

function salesRepToUserStub(rep: CalendlySalesRep): User {
  return {
    id: rep.id,
    email: rep.email,
    first_name: rep.first_name,
    last_name: rep.last_name,
    phone: null,
    role: { id: 0, code: rep.parent_user_id ? "SUB_SELLER" : "SALES_REP", name: "" },
    area: null,
    sede_id: null,
    sede: null,
    client_id: null,
    parent_user_id: rep.parent_user_id ?? null,
    is_sub_seller: rep.parent_user_id != null,
    must_change_password: false,
    totp_enabled: false,
    is_active: rep.is_active !== false,
    last_login_at: null,
    created_at: "",
    avatar_url: null,
  };
}

export function SalesLeaderVendorsPage() {
  const queryClient = useQueryClient();
  const modal = useModal();
  const { token } = useAuth();
  const { t, locale } = useTranslation();
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [detail, setDetail] = useState<User | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reassigning, setReassigning] = useState<CalendlySalesRep | null>(null);
  const [toggling, setToggling] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const { salesReps, loading: loadingReps, reload: reloadReps } = useSalesReps(token, !!token);

  const selectedRep = useMemo(
    () => salesReps.find((rep) => rep.id === selectedRepId) ?? null,
    [salesReps, selectedRepId],
  );

  useEffect(() => {
    if (!token || selectedRepId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setDetailError(null);
    void api
      .get<User>(`/users/${selectedRepId}`, token)
      .then((user) => {
        if (!cancelled) setDetail(user);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailError(getUserFacingErrorMessage(err, t("users.loadError")));
          setDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, selectedRepId, t]);

  const selectedName = selectedRep
    ? `${selectedRep.first_name} ${selectedRep.last_name}`.trim()
    : detail
      ? `${detail.first_name} ${detail.last_name}`.trim()
      : "";
  const selectedIsSub = Boolean(detail?.parent_user_id ?? selectedRep?.parent_user_id);
  const selectedInactive = detail ? !detail.is_active : selectedRep?.is_active === false;
  const parentName = detail?.parent
    ? `${detail.parent.first_name} ${detail.parent.last_name}`.trim()
    : selectedRep?.parent_name ?? "";

  async function handleToggleActive() {
    if (!token || selectedRepId == null) return;
    const next = selectedInactive;
    const confirmed = await modal.confirm({
      title: t(next ? "users.vendorActivate" : "users.vendorDeactivate"),
      message: t(next ? "users.vendorActivateConfirm" : "users.vendorDeactivateConfirm", {
        name: selectedName,
      }),
      confirmLabel: t(next ? "users.vendorActivate" : "users.vendorDeactivate"),
      cancelLabel: t("common.cancel"),
      variant: next ? "primary" : "danger",
    });
    if (!confirmed) return;

    setToggling(true);
    try {
      const updated = await api.patch<User>(
        `/users/${selectedRepId}/active`,
        { is_active: next },
        token,
        { silentHttpErrors: true },
      );
      setDetail(updated);
      await invalidateStaffDirectoryCaches(queryClient);
      await reloadReps();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("users.vendorToggleError")),
        variant: "error",
      });
    } finally {
      setToggling(false);
    }
  }

  if (selectedRepId != null && (selectedRep || detail)) {
    const lastLogin = detail?.last_login_at
      ? new Date(detail.last_login_at).toLocaleString(locale === "en" ? "en-US" : "es")
      : t("users.vendorNeverLogin");

    return (
      <>
        <Header title={t("users.vendorsHeaderContext")} subtitle={selectedName} />
        <PageContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedRepId(null);
                setDetail(null);
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
            >
              <VscArrowLeft className="h-4 w-4" aria-hidden />
              {t("users.backToVendors")}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {selectedInactive ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  {t("common.inactive")}
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant={selectedInactive ? "primary" : "secondary"}
                disabled={toggling}
                onClick={() => void handleToggleActive()}
              >
                {toggling
                  ? t("common.saving")
                  : t(selectedInactive ? "users.vendorActivate" : "users.vendorDeactivate")}
              </Button>
              {selectedIsSub && token ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => selectedRep && setReassigning(selectedRep)}
                >
                  {t("subSellers.reassignAction")}
                </Button>
              ) : null}
            </div>
          </div>

          {detailError ? <div className="alert alert-error">{detailError}</div> : null}
          {loadingDetail && !detail ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="card-flat space-y-3 p-5">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{t("common.email")}: </span>
                {detail?.email ?? selectedRep?.email}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{t("users.vendorPhone")}: </span>
                {detail?.phone || t("common.dash")}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{t("common.role")}: </span>
                {detail?.role.name || (selectedIsSub ? t("subSellers.subSeller") : t("common.dash"))}
              </p>
              {detail?.sede?.name ? (
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{t("users.sede")}: </span>
                  {detail.sede.name}
                </p>
              ) : null}
              {selectedIsSub ? (
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{t("users.vendorParent")}: </span>
                  {parentName || t("common.dash")}
                </p>
              ) : null}
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{t("users.vendorLastLogin")}: </span>
                {lastLogin}
              </p>
            </div>
          )}
        </PageContent>

        {reassigning && token ? (
          <ReassignSubSellerModal
            token={token}
            subSeller={salesRepToUserStub(reassigning)}
            onClose={() => setReassigning(null)}
            onSuccess={async () => {
              setReassigning(null);
              setSelectedRepId(null);
              await invalidateStaffDirectoryCaches(queryClient);
              await reloadReps();
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <Header title={t("users.vendorsHeaderContext")} subtitle={t("users.vendorsTeamSubtitle")} />
      <PageContent>
        {loadingReps ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <SalesRepList
            reps={salesReps}
            onSelect={setSelectedRepId}
            titleKey="users.vendorsListTitle"
            hintKey="users.vendorsListHint"
            showConnectionStatus={false}
          />
        )}
      </PageContent>
    </>
  );
}
