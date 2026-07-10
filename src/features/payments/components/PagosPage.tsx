"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import { PaymentLinkForm } from "@/features/payments/components/PaymentLinkForm";
import { PaymentLinkList } from "@/features/payments/components/PaymentLinkList";
import { RegisterClientFromPaymentModal } from "@/features/payments/components/RegisterClientFromPaymentModal";
import { usePayments } from "@/features/payments/hooks/usePayments";
import type { PaymentLink, PaymentLinkCreatePayload } from "@/features/payments/types";
import { ApiError } from "@/lib/api";
import { CLIENTS_REFRESH_EVENT } from "@/lib/clientEvents";

const PAYMENT_ROLES = new Set(["ADMIN", "SALES_REP"]);

export function PagosPage() {
  const router = useRouter();
  const modal = useModal();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [registerLink, setRegisterLink] = useState<PaymentLink | null>(null);
  const [registering, setRegistering] = useState(false);

  const { config, links, loading, error, createLink, cancelLink, registerClient, isCreating } = usePayments(token);

  const { merchants, loading: merchantsLoading } = useMerchantOptions(token, true);

  useEffect(() => {
    if (user && !PAYMENT_ROLES.has(user.role.code)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || !PAYMENT_ROLES.has(user.role.code)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  async function handleCreate(payload: PaymentLinkCreatePayload) {
    try {
      const result = await createLink(payload);
      await navigator.clipboard.writeText(result.link.payment_url);
      await modal.alert({
        title: t("payments.createSuccessTitle"),
        message: t("payments.createSuccessMessage"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("payments.createError"),
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
        message: err instanceof ApiError ? err.message : t("payments.cancelError"),
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
      const result = await registerClient({ linkId: registerLink.id, payload: { merchant_id: merchantId, source } });
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
        message: err instanceof ApiError ? err.message : t("payments.register.error"),
        variant: "error",
      });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <>
      <Header title={t("payments.title")} subtitle={t("payments.subtitle")} />
      <PageContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-lg font-semibold">{t("payments.form.title")}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t("payments.form.subtitle")}</p>
              <div className="mt-4">
                <PaymentLinkForm config={config} submitting={isCreating} onSubmit={handleCreate} />
              </div>
            </section>

            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-lg font-semibold">{t("payments.list.title")}</h2>
              <div className="mt-4">
                <PaymentLinkList
                  links={links}
                  onCancel={handleCancel}
                  onRegisterClient={setRegisterLink}
                  cancellingId={cancellingId}
                />
              </div>
            </section>
          </div>
        )}
      </PageContent>

      <RegisterClientFromPaymentModal
        link={registerLink}
        merchants={merchants}
        merchantsLoading={merchantsLoading}
        submitting={registering}
        onClose={() => setRegisterLink(null)}
        onSubmit={handleRegister}
      />
    </>
  );
}
