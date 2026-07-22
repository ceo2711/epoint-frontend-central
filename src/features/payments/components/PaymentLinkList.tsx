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
import { Pagination } from "@/components/ui/Pagination";
import { useTranslation } from "@/contexts/LanguageContext";
import type { PaymentLink } from "@/features/payments/types";
import { getProviderLabel } from "@/features/payments/utils/providers";
import { copyToClipboard } from "@/lib/clipboard";

interface PaymentLinkListProps {
  links: PaymentLink[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
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
  page,
  pages,
  total,
  pageSize,
  onPageChange,
  onCancel,
  onRegisterClient,
  onLinkProspect,
  cancellingId,
}: PaymentLinkListProps) {
  const { t, locale } = useTranslation();

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">{t("payments.list.empty")}</p>
    );
  }

  async function copyLink(url: string) {
    await copyToClipboard(url);
  }

  function formatAmount(link: PaymentLink) {
    return `${link.currency} ${Number(link.amount).toFixed(2)}`;
  }

  function formatDate(value: string) {
    try {
      return new Date(value).toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }

  return (
    <div>
      <div className="table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("payments.list.colCustomer")}</th>
              <th>{t("payments.list.colAmount")}</th>
              <th>{t("payments.list.colProvider")}</th>
              <th>{t("payments.list.colStatus")}</th>
              <th>{t("payments.list.colCreatedBy")}</th>
              <th>{t("payments.list.colDate")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id}>
                <td>
                  <span className="block font-medium text-[var(--color-text-primary)]">
                    {link.customer_first_name} {link.customer_last_name}
                  </span>
                  <span className="block text-xs text-[var(--color-text-muted)]">{link.customer_email}</span>
                  {link.description ? (
                    <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)] line-clamp-1">
                      {link.description}
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap tabular-nums">{formatAmount(link)}</td>
                <td className="whitespace-nowrap">{getProviderLabel(link.provider)}</td>
                <td>
                  <span className={`badge ${statusBadgeClass(link.status)}`}>
                    {t(`payments.status.${link.status}`)}
                  </span>
                </td>
                <td className="text-sm text-[var(--color-text-muted)]">
                  {link.created_by_name ?? t("common.dash")}
                </td>
                <td className="whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                  {formatDate(link.created_at)}
                </td>
                <td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
