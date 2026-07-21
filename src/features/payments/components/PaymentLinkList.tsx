"use client";

import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClipboard,
  HiOutlineEye,
  HiOutlineLink,
  HiOutlineUserPlus,
  HiOutlineXMark,
} from "react-icons/hi2";

import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { PaymentLink } from "@/features/payments/types";
import { getProviderLabel } from "@/features/payments/utils/providers";
import { copyToClipboard } from "@/lib/clipboard";

interface PaymentLinkListProps {
  links: PaymentLink[];
  onCancel?: (linkId: number) => void;
  onRegisterClient?: (link: PaymentLink) => void;
  onLinkProspect?: (link: PaymentLink) => void;
  cancellingId?: number | null;
}

function statusBadgeClass(status: PaymentLink["status"]) {
  switch (status) {
    case "paid":
      return "badge-green";
    case "pending":
      return "badge-amber";
    default:
      return "badge-slate";
  }
}

export function PaymentLinkList({
  links,
  onCancel,
  onRegisterClient,
  onLinkProspect,
  cancellingId,
}: PaymentLinkListProps) {
  const { t } = useTranslation();

  if (links.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">{t("payments.list.empty")}</p>
    );
  }

  async function copyLink(url: string) {
    await copyToClipboard(url);
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <article key={link.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                {link.customer_first_name} {link.customer_last_name}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">{link.customer_email}</p>
              <p className="mt-1 text-sm">
                {link.currency} {Number(link.amount).toFixed(2)} · {getProviderLabel(link.provider)}
              </p>
              {link.created_by_name ? (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {t("payments.list.createdBy")}: {link.created_by_name}
                </p>
              ) : null}
            </div>
            <span className={`badge ${statusBadgeClass(link.status)}`}>
              {t(`payments.status.${link.status}`)}
            </span>
          </div>

          {link.description ? (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{link.description}</p>
          ) : null}

          <div className="mt-3">
            <TableActions>
              <IconActionButton
                label={t("payments.list.copyLink")}
                icon={<HiOutlineClipboard />}
                onClick={() => void copyLink(link.payment_url)}
              />
              <IconActionButton
                label={t("payments.list.openLink")}
                icon={<HiOutlineArrowTopRightOnSquare />}
                variant="ghost"
                onClick={() => window.open(link.payment_url, "_blank", "noopener,noreferrer")}
              />
              {link.status === "pending" && onCancel ? (
                <IconActionButton
                  label={t("payments.list.cancel")}
                  icon={<HiOutlineXMark />}
                  variant="danger"
                  disabled={cancellingId === link.id}
                  onClick={() => onCancel(link.id)}
                />
              ) : null}
              {link.status === "paid" && !link.client_registered_at && onRegisterClient ? (
                <IconActionButton
                  label={t("payments.list.registerClient")}
                  icon={<HiOutlineUserPlus />}
                  variant="primary"
                  onClick={() => onRegisterClient(link)}
                />
              ) : null}
              {!link.prospect_id && onLinkProspect ? (
                <IconActionButton
                  label={t("prospects.linkToProspect")}
                  icon={<HiOutlineLink />}
                  variant="ghost"
                  onClick={() => onLinkProspect(link)}
                />
              ) : null}
              {link.client_id ? (
                <IconActionButton
                  href={`/clientes/${link.client_id}`}
                  label={t("payments.list.viewClient")}
                  icon={<HiOutlineEye />}
                />
              ) : null}
            </TableActions>
          </div>
        </article>
      ))}
    </div>
  );
}
