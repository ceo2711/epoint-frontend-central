"use client";

import { useRouter } from "next/navigation";

import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Client } from "@/features/clients/types";
import { ProspectQualificationBadge } from "@/features/prospects/components/ProspectStatusBadge";

interface ClientListProps {
  clients: Client[];
  canBulkDelete?: boolean;
  selectedIds?: number[];
  onToggleSelect?: (clientId: number) => void;
  onToggleSelectAll?: () => void;
  showMerchantColumn?: boolean;
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ClientList({
  clients,
  canBulkDelete = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  showMerchantColumn = false,
  page,
  pages,
  total,
  pageSize,
  onPageChange,
}: ClientListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const selectedSet = new Set(selectedIds);
  const allOnPageSelected = clients.length > 0 && clients.every((client) => selectedSet.has(client.id));
  const someOnPageSelected = clients.some((client) => selectedSet.has(client.id));

  function goToClient(clientId: number) {
    router.push(`/clientes/${clientId}`);
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

  const emptyColSpan = 4 + (showMerchantColumn ? 1 : 0) + (canBulkDelete ? 1 : 0);
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
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={c.status} />
                      <ProspectQualificationBadge isQualified={c.is_qualified ?? true} />
                    </div>
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
              <th>{t("common.status")}</th>
              <th>{t("prospects.columns.qualification")}</th>
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
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    <ProspectQualificationBadge isQualified={c.is_qualified ?? true} />
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
    </>
  );
}
