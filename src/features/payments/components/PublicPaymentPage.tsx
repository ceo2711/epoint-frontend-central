"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { AppLogo } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import { completePublicPaymentStub, fetchPublicPayment } from "@/features/payments/hooks/usePayments";
import type { PublicPaymentLink } from "@/features/payments/types";
import { ApiError } from "@/lib/api";

export function PublicPaymentPage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = params.token;
  const [data, setData] = useState<PublicPaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPublicPayment(token)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : t("payments.public.error")))
      .finally(() => setLoading(false));
  }, [token, t]);

  useEffect(() => {
    if (searchParams.get("paid") === "1" && data?.status === "paid") {
      return;
    }
  }, [searchParams, data]);

  async function handlePay() {
    if (!token || !data?.can_pay) return;
    setPaying(true);
    try {
      const updated = await completePublicPaymentStub(token);
      setData(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("payments.public.payError"));
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="mb-6 flex justify-center">
          <AppLogo />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
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
            <p className="text-xs text-[var(--color-text-muted)]">
              {data.provider === "stripe" ? "Stripe" : "Authorize.net"}
            </p>

            {data.status === "paid" ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t("payments.public.paid")}
              </p>
            ) : data.can_pay && data.stub_mode ? (
              <>
                <p className="text-sm text-amber-800">{t("payments.public.stubHint")}</p>
                <Button fullWidth onClick={handlePay} disabled={paying}>
                  {paying ? t("payments.public.processing") : t("payments.public.payStub")}
                </Button>
              </>
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
