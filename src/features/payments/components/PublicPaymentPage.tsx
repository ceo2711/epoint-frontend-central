"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { AppLogo } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  completePublicPaymentStub,
  confirmPublicPaymentReturn,
  fetchPublicPayment,
} from "@/features/payments/hooks/usePayments";
import type { PublicPaymentLink } from "@/features/payments/types";
import { getProviderLabel } from "@/features/payments/utils/providers";

/** Accept Hosted exige POST del token; GET ?token=... falla con "Missing or invalid token". */
function postAuthorizeHostedCheckout(actionUrl: string, hostedToken: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token";
  input.value = hostedToken;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export function PublicPaymentPage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = params.token;
  const [data, setData] = useState<PublicPaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const paidReturn = searchParams.get("paid") === "1";
        const paypalOrderId = searchParams.get("token");
        if (paidReturn) {
          const confirmed = await confirmPublicPaymentReturn(token, paypalOrderId);
          if (!cancelled) setData(confirmed);
          return;
        }
        const publicData = await fetchPublicPayment(token);
        if (cancelled) return;

        // Saltar la pantalla intermedia: ir directo al checkout del proveedor.
        if (
          publicData.can_pay &&
          !publicData.stub_mode &&
          publicData.checkout_url &&
          publicData.status === "pending"
        ) {
          setRedirecting(true);
          if (publicData.provider === "authorize" && publicData.hosted_payment_token) {
            postAuthorizeHostedCheckout(publicData.checkout_url, publicData.hosted_payment_token);
            return;
          }
          window.location.replace(publicData.checkout_url);
          return;
        }

        setData(publicData);
      } catch (err) {
        if (!cancelled) setError(getUserFacingErrorMessage(err, t("payments.public.error")));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, searchParams, t]);

  async function handlePay() {
    if (!token || !data?.can_pay) return;
    if (data.checkout_url && !data.stub_mode) {
      if (data.provider === "authorize" && data.hosted_payment_token) {
        setPaying(true);
        postAuthorizeHostedCheckout(data.checkout_url, data.hosted_payment_token);
        return;
      }
      window.location.href = data.checkout_url;
      return;
    }
    setPaying(true);
    try {
      const updated = await completePublicPaymentStub(token);
      setData(updated);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("payments.public.payError")));
    } finally {
      setPaying(false);
    }
  }

  const providerLabel = data?.provider_label ?? (data ? getProviderLabel(data.provider) : "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="mb-6 flex justify-center">
          <AppLogo />
        </div>

        {loading || redirecting ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <LoadingSpinner />
            {redirecting ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t("payments.public.redirecting")}</p>
            ) : null}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : data ? (
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{t("payments.public.title")}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {data.customer_first_name} {data.customer_last_name}
            </p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">
              {data.currency} {Number(data.amount).toFixed(2)}
            </p>
            {data.description ? (
              <p className="text-sm text-[var(--color-text-muted)]">{data.description}</p>
            ) : null}
            <p className="text-xs text-[var(--color-text-muted)]">{providerLabel}</p>

            {data.status === "paid" ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t("payments.public.paid")}
              </p>
            ) : data.can_pay && data.stub_mode ? (
              <>
                <p className="text-sm text-amber-800">
                  {data.payment_test
                    ? t("payments.public.testHint")
                    : t("payments.public.stubHint")}
                </p>
                <Button fullWidth onClick={handlePay} disabled={paying}>
                  {paying
                    ? t("payments.public.processing")
                    : data.payment_test
                      ? t("payments.public.pay")
                      : t("payments.public.payStub")}
                </Button>
              </>
            ) : data.can_pay && data.checkout_url ? (
              <Button fullWidth onClick={handlePay} disabled={paying}>
                {paying
                  ? t("payments.public.processing")
                  : t("payments.public.payWithProvider", { provider: providerLabel })}
              </Button>
            ) : data.can_pay ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t("payments.public.awaitingIntegration")}</p>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">{t("payments.public.unavailable")}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
