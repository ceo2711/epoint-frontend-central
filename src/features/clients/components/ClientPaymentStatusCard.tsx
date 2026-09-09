"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import { DEFAULT_PAYMENT_AMOUNT } from "@/features/payments/types";
import type { ProspectPaymentBrief } from "@/features/prospects/types";
import { copyToClipboard } from "@/lib/clipboard";
import { formatDate, formatDateTime } from "@/lib/format-datetime";

import {
  clientPaymentSummaryStatus,
  isShareablePaymentUrl,
  paidTowardStandard,
  remainderDueOn,
  remainingToStandard,
} from "../utils/clientPaymentStatus";

const STATUS_BADGE: Record<Exclude<ReturnType<typeof clientPaymentSummaryStatus>, "empty">, string> = {
  paid: "badge-green",
  partial: "badge-amber",
  pending: "badge-slate",
};

interface ClientPaymentStatusCardProps {
  payments: ProspectPaymentBrief[];
}

export function ClientPaymentStatusCard({ payments }: ClientPaymentStatusCardProps) {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const summary = clientPaymentSummaryStatus(payments);
  const paid = paidTowardStandard(payments);
  const remaining = remainingToStandard(payments);
  const dueOn = remainderDueOn(payments);
  const currency = payments[0]?.currency ?? "USD";

  async function handleCopy(url: string, id: number) {
    const ok = await copyToClipboard(url);
    if (!ok) return;
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
  }

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
        {t("clientDetail.paymentTitle")}
      </h2>
      <p className="mb-4 text-sm text-slate-500">{t("clientDetail.paymentHint")}</p>

      {summary === "empty" ? (
        <p className="text-sm text-slate-600">{t("clientDetail.paymentEmpty")}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_BADGE[summary]}`}>
              {t(`clientDetail.paymentStatus.${summary}`)}
            </span>
            <p className="text-sm font-semibold text-slate-900">
              {t("payments.public.paidOfTotal", {
                currency,
                paid: paid.toFixed(2),
                total: DEFAULT_PAYMENT_AMOUNT.toFixed(2),
              })}
            </p>
          </div>

          {remaining > 0.009 ? (
            <p className="text-sm font-medium text-amber-800">
              {t("prospects.linked.remainingToStandard", {
                amount: remaining.toFixed(2),
                currency,
              })}
            </p>
          ) : null}

          {dueOn ? (
            <p className="text-sm text-slate-500">
              {t("prospects.linked.remainderDueOn", { date: formatDate(dueOn) })}
            </p>
          ) : null}

          <ul className="space-y-2">
            {payments.map((payment) => {
              const canShare = isShareablePaymentUrl(payment.payment_url);
              return (
                <li
                  key={payment.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      {payment.currency} {Number(payment.amount_paid ?? 0).toFixed(2)}
                      {" / "}
                      {Number(payment.amount).toFixed(2)}
                    </p>
                    <span className="text-slate-600">
                      {t(`payments.status.${payment.status}` as never)}
                    </span>
                  </div>
                  {payment.paid_at ? (
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(payment.paid_at)}</p>
                  ) : null}
                  {canShare ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => void handleCopy(payment.payment_url, payment.id)}
                      >
                        {copiedId === payment.id ? t("common.copied") : t("payments.list.copyLink")}
                      </Button>
                      <a
                        href={payment.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-xs"
                      >
                        {t("payments.list.openLink")}
                      </a>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">{t("clientDetail.paymentNoShareableLink")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
