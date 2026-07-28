"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Notification } from "@/types/api";

const DEFAULT_COMMISSION_USD = 500;

export function isSaleCongratsNotification(notification: Notification): boolean {
  if (notification.event_type === "PROSPECT_CONVERTED") return true;
  if (
    notification.event_type === "PAYMENT_LINK_COMPLETED" &&
    typeof notification.payload?.client_id === "number"
  ) {
    return true;
  }
  return false;
}

function formatMoney(amount: string | number | undefined, currency = "USD"): string {
  const value = typeof amount === "number" ? amount : Number(amount ?? NaN);
  if (!Number.isFinite(value)) return `${currency} —`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

interface SaleCongratsModalProps {
  notification: Notification;
  canNavigate: boolean;
  onNavigate: () => void;
  onClose: () => void;
}

export function SaleCongratsModal({
  notification,
  canNavigate,
  onNavigate,
  onClose,
}: SaleCongratsModalProps) {
  const { t } = useTranslation();
  const payload = notification.payload ?? {};
  const customerName =
    typeof payload.customer_name === "string" && payload.customer_name.trim()
      ? payload.customer_name.trim()
      : t("notifications.saleCongrats.customerFallback");
  const currency =
    typeof payload.currency === "string" && payload.currency.trim()
      ? payload.currency.trim()
      : "USD";
  const paidAmount =
    payload.amount !== undefined ? formatMoney(payload.amount as string | number, currency) : null;
  const commissionRaw =
    payload.commission_usd !== undefined
      ? Number(payload.commission_usd)
      : DEFAULT_COMMISSION_USD;
  const commission = formatMoney(commissionRaw, "USD");

  return (
    <Modal
      title={t("notifications.saleCongrats.title")}
      subtitle={t("notifications.saleCongrats.subtitle")}
      onClose={onClose}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("common.close")}
          </Button>
          {canNavigate ? (
            <Button onClick={onNavigate}>{t("notifications.saleCongrats.viewClient")}</Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner ring-1 ring-emerald-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" aria-hidden>
              <path
                fillRule="evenodd"
                d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <p className="text-center text-base font-semibold text-slate-900">
          {t("notifications.saleCongrats.headline", { name: customerName })}
        </p>
        <p className="text-center text-sm leading-relaxed text-slate-600">
          {t("notifications.saleCongrats.body")}
        </p>

        <div className="grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 sm:grid-cols-2">
          {paidAmount ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
                {t("notifications.saleCongrats.paidLabel")}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-emerald-900">{paidAmount}</p>
            </div>
          ) : null}
          <div className={paidAmount ? "" : "sm:col-span-2"}>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
              {t("notifications.saleCongrats.commissionLabel")}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-900">{commission}</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          {t("notifications.saleCongrats.footerHint")}
        </p>
      </div>
    </Modal>
  );
}
