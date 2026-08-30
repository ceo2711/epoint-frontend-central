"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineEnvelope } from "react-icons/hi2";

import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Client } from "@/features/clients/types";
import { SendEmailModal } from "@/features/emails/components/SendEmailModal";
import { ProspectQualificationBadge, ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import { clientDetailPath } from "@/lib/clientsNavigation";

interface ClientListProps {
  clients: Client[];
  canBulkDelete?: boolean;
  selectedIds?: number[];
  onToggleSelect?: (clientId: number) => void;
  onToggleSelectAll?: () => void;
  showMerchantColumn?: boolean;
  showSalesRepColumn?: boolean;
  showAdvisorColumn?: boolean;
  /** Sede activa (admin): se preserva al abrir el detalle. */
  sedeId?: number | null;
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onInboxOpened?: () => void;
}

function EmailInboxIcon({ unread }: { unread: boolean }) {
  return (
    <span className="relative inline-flex">
      <HiOutlineEnvelope className="h-4 w-4" />
      {unread ? (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      ) : null}
    </span>
  );
}

function salesRepLabel(client: Client, dash: string) {
  if (!client.registered_by) return dash;
  return `${client.registered_by.first_name} ${client.registered_by.last_name}`;
}

function advisorLabel(client: Client, dash: string) {
  const list = client.advisors?.length
    ? client.advisors
    : client.advisor
      ? [client.advisor]
      : [];
  if (!list.length) return dash;
  if (list.length === 1) return `${list[0].first_name} ${list[0].last_name}`;
  return `${list[0].first_name} ${list[0].last_name} +${list.length - 1}`;
}

export function ClientList({
  clients,
  canBulkDelete = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  showMerchantColumn = false,
  showSalesRepColumn = false,
  showAdvisorColumn = false,
  sedeId = null,
  page,
  pages,
  total,
  pageSize,
  onPageChange,
  onInboxOpened,
}: ClientListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [emailTarget, setEmailTarget] = useState<Client | null>(null);
  const selectedSet = new Set(selectedIds);
  const allOnPageSelected = clients.length > 0 && clients.every((client) => selectedSet.has(client.id));
  const someOnPageSelected = clients.some((client) => selectedSet.has(client.id));

  function goToClient(clientId: number) {
    router.push(clientDetailPath(clientId, sedeId));
  }

  function renderCheckbox(clientId: number, name: string) {
    if (!canBulkDelete || !onToggleSelect) return null;
    return (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
        checked={selectedSet.has(clientId)}
        aria-label={t("clients.selectAllOnPage") + `: ${name}`}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggleSelect(clientId)}
      />
    );
  }

  const emptyColSpan =
    5 +
    (showMerchantColumn ? 1 : 0) +
    (showSalesRepColumn ? 1 : 0) +
    (showAdvisorColumn ? 1 : 0) +
    (canBulkDelete ? 1 : 0);
  return (
    <>
      <div className="space-y-3 md:hidden">
        {clients.map((c) => {
          const name = `${c.first_name} ${c.last_name}`;
          return (
            <div
              key={c.id}
              className="card-flat cursor-pointer p-4 transition-colors duration-150 hover:bg-[#f1efe9]"
              role="link"
              tabIndex={0}
              onClick={() => goToClient(c.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  goToClient(c.id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                {renderCheckbox(c.id, name)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{name}</p>
                      <p className="mt-1 break-all text-sm text-slate-500">{c.email}</p>
                      {showMerchantColumn && c.merchant?.name ? (
                        <p className="mt-1 text-sm text-slate-500">{c.merchant.name}</p>
                      ) : null}
                      {showSalesRepColumn ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {t("prospects.columns.salesRep")}: {salesRepLabel(c, t("common.dash"))}
                        </p>
                      ) : null}
                      {showAdvisorColumn ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {t("clients.columns.advisor")}: {advisorLabel(c, t("common.dash"))}
                          {c.advisor?.email ? (
                            <span className="block break-all text-slate-400">{c.advisor.email}</span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={c.status} />
                      {c.source_prospect_status ? (
                        <ProspectStatusBadge status={c.source_prospect_status} />
                      ) : null}
                      <ProspectQualificationBadge isQualified={c.is_qualified ?? true} />
                    </div>
                  </div>
                  <div className="mt-3" onClick={(event) => event.stopPropagation()}>
                    <TableActions>
                      <IconActionButton
                        label={
                          c.has_unread_inbound_email
                            ? t("emailCompose.unreadInbox")
                            : t("emailCompose.action")
                        }
                        icon={<EmailInboxIcon unread={!!c.has_unread_inbound_email} />}
                        onClick={() => setEmailTarget(c)}
                      />
                    </TableActions>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {clients.length === 0 && (
          <Card className="p-8 text-center text-slate-400">{t("clients.empty")}</Card>
        )}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              {canBulkDelete ? (
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    checked={allOnPageSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someOnPageSelected && !allOnPageSelected;
                    }}
                    aria-label={t("clients.selectAllOnPage")}
                    onChange={() => onToggleSelectAll?.()}
                  />
                </th>
              ) : null}
              <th>{t("common.client")}</th>
              <th>{t("common.email")}</th>
              {showMerchantColumn ? <th>{t("clients.merchant")}</th> : null}
              {showSalesRepColumn ? <th>{t("prospects.columns.salesRep")}</th> : null}
              {showAdvisorColumn ? <th>{t("clients.columns.advisor")}</th> : null}
              <th>{t("common.status")}</th>
              <th>{t("prospects.columns.qualification")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const name = `${c.first_name} ${c.last_name}`;
              return (
                <tr
                  key={c.id}
                  role="link"
                  tabIndex={0}
                  className={`cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
                    selectedSet.has(c.id) ? "bg-brand-muted/20" : ""
                  }`}
                  onClick={() => goToClient(c.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToClient(c.id);
                    }
                  }}
                >
                  {canBulkDelete ? <td onClick={(event) => event.stopPropagation()}>{renderCheckbox(c.id, name)}</td> : null}
                  <td className="font-semibold text-slate-900">{name}</td>
                  <td className="text-slate-500">{c.email}</td>
                  {showMerchantColumn ? (
                    <td className="text-slate-500">{c.merchant?.name ?? t("common.dash")}</td>
                  ) : null}
                  {showSalesRepColumn ? (
                    <td className="text-slate-500">{salesRepLabel(c, t("common.dash"))}</td>
                  ) : null}
                  {showAdvisorColumn ? (
                    <td className="text-slate-500">
                      <span className="block">{advisorLabel(c, t("common.dash"))}</span>
                      {c.advisor?.email ? (
                        <span className="block text-xs text-slate-400">{c.advisor.email}</span>
                      ) : null}
                    </td>
                  ) : null}
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={c.status} />
                      {c.source_prospect_status ? (
                        <ProspectStatusBadge status={c.source_prospect_status} />
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <ProspectQualificationBadge isQualified={c.is_qualified ?? true} />
                  </td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <TableActions>
                      <IconActionButton
                        label={
                          c.has_unread_inbound_email
                            ? t("emailCompose.unreadInbox")
                            : t("emailCompose.action")
                        }
                        icon={<EmailInboxIcon unread={!!c.has_unread_inbound_email} />}
                        onClick={() => setEmailTarget(c)}
                      />
                    </TableActions>
                  </td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr>
                <td colSpan={emptyColSpan} className="py-12 text-center text-slate-400">
                  {t("clients.empty")}
                </td>
              </tr>
            )}
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

      {emailTarget ? (
        <SendEmailModal
          recipientName={`${emailTarget.first_name} ${emailTarget.last_name}`}
          recipientEmail={emailTarget.email}
          basePath={`/clients/${emailTarget.id}`}
          threadMode
          onThreadOpened={onInboxOpened}
          onClose={() => setEmailTarget(null)}
        />
      ) : null}
    </>
  );
}
