"use client";

import Link from "next/link";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineXCircle,
} from "react-icons/hi2";

import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Client } from "@/features/clients/types";

interface ClientListProps {
  clients: Client[];
  canApprove: boolean;
  canUpdate: boolean;
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
  onApprove: (id: number, name: string) => Promise<void>;
  onReject: (id: number, name: string) => Promise<void>;
  onResubmit: (id: number, name: string) => Promise<void>;
}

export function ClientList({
  clients,
  canApprove,
  canUpdate,
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
  onApprove,
  onReject,
  onResubmit,
}: ClientListProps) {
  const { t } = useTranslation();
  const selectedSet = new Set(selectedIds);
  const allOnPageSelected = clients.length > 0 && clients.every((client) => selectedSet.has(client.id));
  const someOnPageSelected = clients.some((client) => selectedSet.has(client.id));

  function renderCheckbox(clientId: number, name: string) {
    if (!canBulkDelete || !onToggleSelect) return null;
    return (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
        checked={selectedSet.has(clientId)}
        aria-label={t("clients.selectAllOnPage") + `: ${name}`}
        onChange={() => onToggleSelect(clientId)}
      />
    );
  }

  function renderActions(c: Client, name: string) {
    return (
      <TableActions>
        <IconActionButton
          href={`/clientes/${c.id}`}
          label={t("common.view")}
          icon={<HiOutlineEye />}
        />
        {c.status === "PENDIENTE_DE_REVISION" && canApprove ? (
          <>
            <IconActionButton
              label={t("clients.approve")}
              icon={<HiOutlineCheckCircle />}
              variant="primary"
              onClick={() => void onApprove(c.id, name)}
            />
            <IconActionButton
              label={t("clients.reject")}
              icon={<HiOutlineXCircle />}
              variant="danger"
              onClick={() => void onReject(c.id, name)}
            />
          </>
        ) : null}
        {c.status === "RECHAZADO" && canUpdate ? (
          <IconActionButton
            label={t("clients.resubmit")}
            icon={<HiOutlineArrowUturnLeft />}
            onClick={() => void onResubmit(c.id, name)}
          />
        ) : null}
      </TableActions>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {clients.map((c) => {
          const name = `${c.first_name} ${c.last_name}`;
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                {renderCheckbox(c.id, name)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/clientes/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                        {name}
                      </Link>
                      <p className="mt-1 break-all text-sm text-slate-500">{c.email}</p>
                      {showMerchantColumn && c.merchant?.name ? (
                        <p className="mt-1 text-sm text-slate-500">{c.merchant.name}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-3">{renderActions(c, name)}</div>
                </div>
              </div>
            </Card>
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
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const name = `${c.first_name} ${c.last_name}`;
              return (
                <tr key={c.id} className={selectedSet.has(c.id) ? "bg-brand-muted/20" : undefined}>
                  {canBulkDelete ? <td>{renderCheckbox(c.id, name)}</td> : null}
                  <td>
                    <Link href={`/clientes/${c.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                      {name}
                    </Link>
                  </td>
                  <td className="text-slate-500">{c.email}</td>
                  {showMerchantColumn ? (
                    <td className="text-slate-500">{c.merchant?.name ?? t("common.dash")}</td>
                  ) : null}
                  <td><StatusBadge status={c.status} /></td>
                  <td>{renderActions(c, name)}</td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr>
                <td colSpan={(showMerchantColumn ? 5 : 4) + (canBulkDelete ? 1 : 0)} className="py-12 text-center text-slate-400">
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
