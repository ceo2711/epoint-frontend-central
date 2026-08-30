"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { copyToClipboard } from "@/lib/clipboard";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner, PageLoader } from "@/components/ui/LoadingSpinner";
import {
  SalesToolsScopeToggle,
  type SalesToolsScope,
} from "@/components/ui/SalesToolsScopeToggle";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import { PaymentLinkForm } from "@/features/payments/components/PaymentLinkForm";
import { PaymentLinkList } from "@/features/payments/components/PaymentLinkList";
import { RegisterClientFromPaymentModal } from "@/features/payments/components/RegisterClientFromPaymentModal";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { PROSPECT_SEARCH_LIMIT } from "@/features/prospects/components/ProspectSearchSelect";
import { ProspectLinkPickerModal } from "@/features/prospects/components/ProspectLinkPickerModal";
import { SedeBranchList } from "@/features/sedes/components/SedeBranchList";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import {
  buildSedeBranchesFromReps,
  filterRepsBySede,
} from "@/features/sedes/utils/sedeBranches";
import type { Prospect } from "@/features/prospects/types";
import type { PaymentLink, PaymentLinkCreatePayload } from "@/features/payments/types";
import type { Paginated } from "@/types/api";
import { api } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT } from "@/lib/clientEvents";
import { canSell, canSuperviseSalesReps, isGlobalAdmin, isSalesAreaLeader } from "@/lib/roles";

const PAYMENT_ROLES = new Set(["ADMIN", "BRANCH_MANAGER", "SALES_REP", "SUB_SELLER", "AREA_LEADER"]);

export function PagosPage() {
  const router = useRouter();
  const modal = useModal();
  const { user, token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [registerLink, setRegisterLink] = useState<PaymentLink | null>(null);
  const [linkPayment, setLinkPayment] = useState<PaymentLink | null>(null);
  const [registering, setRegistering] = useState(false);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [scope, setScope] = useState<SalesToolsScope>("own");

  const canSupervise = canSuperviseSalesReps(user);
  const salesLeader = isSalesAreaLeader(user);
  const canSellTools = canSell(user);
  const isGlobal = isGlobalAdmin(user?.role.code);
  const viewingTeam = canSupervise && (!canSellTools || scope === "team");
  const viewingOwn = canSellTools && (!canSupervise || scope === "own");
  const canLinkProspect = hasPermission("prospects:update");
  const canSearchProspects = hasPermission("prospects:read");

  const {
    config,
    links,
    page,
    pages,
    total,
    pageSize,
    setPage,
    loading,
    loadingLinks,
    error,
    createLink,
    resendLink,
    cancelLink,
    registerClient,
    isCreating,
  } = usePayments(token, {
    adminView: viewingTeam,
    salesRepId: viewingTeam ? selectedRepId : undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [selectedRepId, setPage]);

  const { merchants, loading: merchantsLoading } = useMerchantOptions(token, viewingOwn);
  const { sedes, loading: loadingSedes } = useSedes(
    token,
    isGlobal && hasPermission("sedes:read"),
    t("sedes.loadError"),
    "",
    false,
  );

  const { salesReps, loading: loadingReps } = useSalesReps(token, viewingTeam);

  useEffect(() => {
    if (!user) return;
    const allowed =
      PAYMENT_ROLES.has(user.role.code) &&
      (user.role.code !== "AREA_LEADER" || isSalesAreaLeader(user));
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const branches = useMemo(
    () =>
      buildSedeBranchesFromReps(salesReps, sedes, {
        includeAllSedes: isGlobal,
        fallbackName: t("users.sede"),
      }),
    [salesReps, sedes, isGlobal, t],
  );

  const repsForSelectedSede = useMemo(
    () =>
      filterRepsBySede(salesReps, selectedSedeId, {
        filterBySede: isGlobal,
      }),
    [salesReps, selectedSedeId, isGlobal],
  );

  const selectedSede = branches.find((branch) => branch.id === selectedSedeId) ?? null;

  if (
    !user ||
    !PAYMENT_ROLES.has(user.role.code) ||
    (user.role.code === "AREA_LEADER" && !isSalesAreaLeader(user))
  ) {
    return <PageLoader />;
  }

  const selectedRep = salesReps.find((rep) => rep.id === selectedRepId);
  const selectedRepName = selectedRep
    ? `${selectedRep.first_name} ${selectedRep.last_name}`
    : t("common.dash");
  const adminLoading = loadingReps || (isGlobal && loadingSedes);
  const pageLoading = viewingTeam ? adminLoading : loading;

  function handleScopeChange(next: SalesToolsScope) {
    setScope(next);
    setSelectedRepId(null);
  }

  function handleSelectSede(id: number) {
    setSelectedSedeId(id);
    setSelectedRepId(null);
  }

  function handleBackFromReps() {
    setSelectedRepId(null);
    if (isGlobal) {
      setSelectedSedeId(null);
    }
  }

  function handleBackFromLinks() {
    setSelectedRepId(null);
  }

  async function searchProspects(query: string) {
    if (!token || !canSearchProspects) return { items: [], total: 0 };
    const params = new URLSearchParams({
      search: query,
      page: "1",
      page_size: String(PROSPECT_SEARCH_LIMIT),
    });
    const data = await api.get<Paginated<Prospect>>(`/prospects?${params.toString()}`, token);
    return { items: data.items, total: data.total };
  }

  async function handleCreate(payload: PaymentLinkCreatePayload) {
    try {
      const result = await createLink(payload);
      await copyToClipboard(result.link.payment_url);
      await modal.alert({
        title: result.email_sent
          ? t("payments.createSuccessEmailTitle")
          : t("payments.createSuccessTitle"),
        message: result.message || (
          result.email_sent
            ? t("payments.createSuccessEmailMessage", { email: payload.customer_email })
            : t("payments.createSuccessMessage")
        ),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("payments.createError")),
        variant: "error",
      });
    }
  }

  async function handleResend(linkId: number) {
    setResendingId(linkId);
    try {
      const result = await resendLink(linkId);
      await modal.alert({
        title: result.email_sent
          ? t("payments.resendSuccessEmailTitle")
          : t("payments.resendSuccessTitle"),
        message: result.message || (
          result.email_sent
            ? t("payments.resendSuccessEmailMessage")
            : t("payments.resendSuccessMessage")
        ),
        variant: result.email_sent ? "success" : "warning",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("payments.resendError")),
        variant: "error",
      });
    } finally {
      setResendingId(null);
    }
  }

  async function handleCancel(linkId: number) {
    setCancellingId(linkId);
    try {
      await cancelLink(linkId);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("payments.cancelError")),
        variant: "error",
      });
    } finally {
      setCancellingId(null);
    }
  }

  async function handleRegister(merchantId: number, source: string) {
    if (!registerLink) return;
    setRegistering(true);
    try {
      const result = await registerClient({
        linkId: registerLink.id,
        payload: { merchant_id: merchantId, source },
      });
      window.dispatchEvent(new Event(CLIENTS_REFRESH_EVENT));
      setRegisterLink(null);
      await modal.alert({
        title: t("payments.register.successTitle"),
        message: result.message,
        variant: "success",
      });
      router.push(`/clientes/${result.client_id}`);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("payments.register.error")),
        variant: "error",
      });
    } finally {
      setRegistering(false);
    }
  }

  async function handleLinkPaymentToProspect(prospectId: number) {
    if (!token || !linkPayment) return;
    try {
      await api.post(
        `/prospects/${prospectId}/link-payment`,
        { payment_link_id: linkPayment.id },
        token,
      );
      setLinkPayment(null);
      await modal.alert({
        title: t("prospects.linkPaymentSuccessTitle"),
        message: t("prospects.linkPaymentSuccessMessage"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  const pageSubtitle = viewingTeam
    ? isGlobal
      ? t("payments.adminPageSubtitleSedes")
      : t("payments.adminPageSubtitle")
    : t("payments.subtitle");

  function renderAdminContent() {
    // ADMIN global: primero sedes
    if (isGlobal && selectedSedeId === null) {
      return (
        <SedeBranchList
          branches={branches}
          onSelect={handleSelectSede}
          titleKey="payments.adminSedesTitle"
          hintKey="payments.adminSedesSubtitle"
          emptyKey="payments.adminSedesEmpty"
          countLabelKey="payments.adminSedeRepCount"
        />
      );
    }

    // Lista de vendedores (sede seleccionada o gerente de sucursal)
    if (selectedRepId === null) {
      return (
        <>
          {isGlobal ? (
            <button
              type="button"
              onClick={handleBackFromReps}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <VscArrowLeft className="h-4 w-4" aria-hidden />
              {t("payments.backToSedes")}
            </button>
          ) : null}
          {selectedSede ? (
            <div className="card-flat mb-4 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{selectedSede.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("payments.adminRepsSubtitle")}</p>
            </div>
          ) : null}
          <SalesRepList
            reps={repsForSelectedSede}
            onSelect={setSelectedRepId}
            titleKey="payments.adminRepsTitle"
            hintKey="payments.adminRepsSubtitle"
            showConnectionStatus={false}
          />
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={handleBackFromLinks}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <VscArrowLeft className="h-4 w-4" aria-hidden />
          {t("payments.backToSalesReps")}
        </button>

        <div className="card-flat p-5">
          <h2 className="text-lg font-semibold text-slate-900">{selectedRepName}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("payments.adminRepLinksHint")}</p>
        </div>

        {loadingLinks ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="text-lg font-semibold">
              {t("payments.list.titleForRep", { name: selectedRepName })}
            </h2>
            <div className="mt-4">
              <PaymentLinkList
                links={links}
                page={page}
                pages={pages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onCancel={handleCancel}
                onResend={handleResend}
                onLinkProspect={canLinkProspect ? setLinkPayment : undefined}
                cancellingId={cancellingId}
                resendingId={resendingId}
              />
            </div>
          </section>
        )}
      </>
    );
  }

  return (
    <>
      <Header title={t(viewingTeam ? "payments.adminHeaderContext" : "payments.headerContext")} subtitle={pageSubtitle} />
      {pageLoading ? (
        <PageLoader label={t("common.loading")} />
      ) : (
        <PageContent className="space-y-6">
          {error ? (
            <p className="text-sm text-red-600">{getUserFacingErrorMessage(error, t("common.error"))}</p>
          ) : null}

          {salesLeader ? (
            <SalesToolsScopeToggle value={scope} onChange={handleScopeChange} />
          ) : null}

          {viewingTeam ? (
            renderAdminContent()
          ) : (
            <div className="space-y-6">
              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="text-lg font-semibold">{t("payments.form.title")}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t("payments.form.subtitle")}</p>
                <div className="mt-4">
                  <PaymentLinkForm
                    config={config}
                    submitting={isCreating}
                    onSubmit={handleCreate}
                    onSearchProspects={canSearchProspects ? searchProspects : undefined}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="text-lg font-semibold">{t("payments.list.title")}</h2>
                <div className="mt-4">
                  <PaymentLinkList
                    links={links}
                    page={page}
                    pages={pages}
                    total={total}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onCancel={handleCancel}
                    onResend={handleResend}
                    onRegisterClient={setRegisterLink}
                    onLinkProspect={canLinkProspect ? setLinkPayment : undefined}
                    cancellingId={cancellingId}
                    resendingId={resendingId}
                  />
                </div>
              </section>
            </div>
          )}
        </PageContent>
      )}

      {viewingOwn ? (
        <RegisterClientFromPaymentModal
          link={registerLink}
          merchants={merchants}
          merchantsLoading={merchantsLoading}
          submitting={registering}
          onClose={() => setRegisterLink(null)}
          onSubmit={handleRegister}
        />
      ) : null}

      {linkPayment && canLinkProspect ? (
        <ProspectLinkPickerModal
          token={token}
          title={t("prospects.linkToProspect")}
          emailHint={linkPayment.customer_email}
          salesRepId={viewingTeam ? selectedRepId : null}
          onClose={() => setLinkPayment(null)}
          onSelect={handleLinkPaymentToProspect}
        />
      ) : null}
    </>
  );
}
