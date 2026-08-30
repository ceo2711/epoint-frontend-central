"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import type { ProspectPaymentBrief } from "@/features/prospects/types";
import { formatDateTime } from "@/lib/format-datetime";

interface ProspectPaymentsModalProps {
  payments: ProspectPaymentBrief[];
  locale: string;
  onClose: () => void;
  onResendPayment?: (linkId: number) => void;
  resendingId?: number | null;
}

function paymentStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return "bg-emerald-100 text-emerald-800";
  if (normalized === "cancelled" || normalized === "expired") return "bg-red-100 text-red-800";
  if (normalized === "pending" || normalized === "partial") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export function ProspectPaymentsModal({
  payments,
  onClose,
  onResendPayment,
  resendingId,
}: ProspectPaymentsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("prospects.paymentsListTitle")}
      subtitle={t("prospects.paymentsListSubtitle", { count: payments.length })}
      onClose={onClose}
      size="lg"
    >
      {payments.length === 0 ? (
        <p className="text-sm text-slate-500">{t("prospects.linked.paymentEmpty")}</p>
      ) : (
        <ul className="max-h-[420px] space-y-3 overflow-y-auto">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {payment.currency} {Number(payment.amount).toFixed(2)}
                  {payment.status.toLowerCase() === "partial" && payment.remaining_amount
                    ? ` · ${t("payments.public.remainingShort", {
                        amount: Number(payment.remaining_amount).toFixed(2),
                        currency: payment.currency,
                      })}`
                    : null}
                </p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${paymentStatusClass(payment.status)}`}
                >
                  {t(`payments.status.${payment.status}` as never)}
                </span>
              </div>
              <p className="mt-1 text-slate-600">
                {payment.paid_at
                  ? t("prospects.linked.paidAt", {
                      date: formatDateTime(payment.paid_at),
                    })
                  : t("prospects.linked.paymentCreatedAt", {
                      date: formatDateTime(payment.created_at),
                    })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {payment.status.toLowerCase() === "pending" || payment.status.toLowerCase() === "partial" ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(payment.payment_url, "_blank", "noopener,noreferrer")}
                    >
                      {t("payments.list.openLink")}
                    </Button>
                    {onResendPayment ? (
                      <Button
                        size="sm"
                        disabled={resendingId === payment.id}
                        onClick={() => onResendPayment(payment.id)}
                      >
                        {resendingId === payment.id
                          ? t("payments.list.resendingEmail")
                          : t("payments.list.resendEmail")}
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
