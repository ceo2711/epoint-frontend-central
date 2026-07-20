"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { PaymentLinkForm } from "@/features/payments/components/PaymentLinkForm";
import { PaymentLinkList } from "@/features/payments/components/PaymentLinkList";
import { RegisterClientFromPaymentModal } from "@/features/payments/components/RegisterClientFromPaymentModal";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { PROSPECT_SEARCH_LIMIT } from "@/features/prospects/components/ProspectSearchSelect";
import { ProspectLinkPickerModal } from "@/features/prospects/components/ProspectLinkPickerModal";
import type { Prospect } from "@/features/prospects/types";
import type { PaymentLink, PaymentLinkCreatePayload } from "@/features/payments/types";
import type { Paginated } from "@/types/api";
import { api } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT } from "@/lib/clientEvents";
import { fetchCalendlySalesReps } from "@/lib/queryFetchers";

const PAYMENT_ROLES = new Set(["ADMIN", "SALES_REP"]);

export function PagosPage() {
  const router = useRouter();
  const modal = useModal();
  const { user, token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [registerLink, setRegisterLink] = useState<PaymentLink | null>(null);
  const [linkPayment, setLinkPayment] = useState<PaymentLink | null>(null);
  const [registering, setRegistering] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [salesReps, setSalesReps] = useState<CalendlySalesRep[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);

  const isAdmin = user?.role.code === "ADMIN";
  const isSalesRep = user?.role.code === "SALES_REP";
  const canLinkProspect = hasPermission("prospects:update");
  const canSearchProspects = hasPermission("prospects:read");

  const {
    config,
    links,
    loading,
    loadingLinks,
    error,
    createLink,
    cancelLink,
    registerClient,
    isCreating,
  } = usePayments(token, {
    adminView: isAdmin,
    salesRepId: isAdmin ? selectedRepId : undefined,
  });

  const { merchants, loading: merchantsLoading } = useMerchantOptions(token, isSalesRep);

  useEffect(() => {
    if (user && !PAYMENT_ROLES.has(user.role.code)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    setLoadingReps(true);
    fetchCalendlySalesReps(token)
      .then(setSalesReps)
      .catch(() => setSalesReps([]))
      .finally(() => setLoadingReps(false));
  }, [token, isAdmin]);

  if (!user || !PAYMENT_ROLES.has(user.role.code)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedRep = salesReps.find((rep) => rep.id === selectedRepId);
  const selectedRepName = selectedRep
    ? `${selectedRep.first_name} ${selectedRep.last_name}`
    : t("common.dash");

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
      await navigator.clipboard.writeText(result.link.payment_url);
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

  const pageSubtitle = isAdmin ? t("payments.adminPageSubtitle") : t("payments.subtitle");

  return (
    <>
      <Header title={t("payments.headerContext")} subtitle={pageSubtitle} />
      <PageContent className="space-y-6">
        {error ? (
          <p className="text-sm text-red-600">{getUserFacingErrorMessage(error, t("common.error"))}</p>
        ) : null}

        {isAdmin ? (
          selectedRepId === null ? (
            loadingReps ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : (
              <SalesRepList
                reps={salesReps}
                onSelect={setSelectedRepId}
                titleKey="payments.adminRepsTitle"
                hintKey="payments.adminRepsSubtitle"
                showConnectionStatus={false}
              />
            )
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectedRepId(null)}
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
                      onCancel={handleCancel}
                      onLinkProspect={canLinkProspect ? setLinkPayment : undefined}
                      cancellingId={cancellingId}
                    />
                  </div>
                </section>
              )}
            </>
          )
        ) : loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
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
                  onCancel={handleCancel}
                  onRegisterClient={setRegisterLink}
                  onLinkProspect={canLinkProspect ? setLinkPayment : undefined}
                  cancellingId={cancellingId}
                />
              </div>
            </section>
          </div>
        )}
      </PageContent>

      {isSalesRep ? (
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
          onClose={() => setLinkPayment(null)}
          onSelect={handleLinkPaymentToProspect}
        />
      ) : null}
    </>
  );
}
