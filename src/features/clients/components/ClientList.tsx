"use client";

import Link from "next/link";

import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Client } from "@/features/clients/types";

interface ClientListProps {
  clients: Client[];
  canApprove: boolean;
  canUpdate: boolean;
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

  return (
    <>
      <div className="space-y-3 md:hidden">
        {clients.map((c) => {
          const name = `${c.first_name} ${c.last_name}`;
          return (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/clientes/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                    {name}
                  </Link>
                  <p className="mt-1 break-all text-sm text-slate-500">{c.email}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/clientes/${c.id}`} className="btn btn-secondary btn-sm">
                  {t("common.view")}
                </Link>
                {c.status === "PENDIENTE_DE_REVISION" && canApprove && (
                  <>
                    <button type="button" onClick={() => onApprove(c.id, name)} className="btn btn-primary btn-sm">
                      {t("clients.approve")}
                    </button>
                    <button type="button" onClick={() => onReject(c.id, name)} className="btn btn-danger btn-sm">
                      {t("clients.reject")}
                    </button>
                  </>
                )}
                {c.status === "RECHAZADO" && canUpdate && (
                  <button type="button" onClick={() => onResubmit(c.id, name)} className="btn btn-secondary btn-sm">
                    {t("clients.resubmit")}
                  </button>
                )}
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
              <th>{t("common.client")}</th>
              <th>{t("common.email")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const name = `${c.first_name} ${c.last_name}`;
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/clientes/${c.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                      {name}
                    </Link>
                  </td>
                  <td className="text-slate-500">{c.email}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/clientes/${c.id}`} className="btn btn-secondary btn-sm">
                        {t("common.view")}
                      </Link>
                      {c.status === "PENDIENTE_DE_REVISION" && canApprove && (
                        <>
                          <button type="button" onClick={() => onApprove(c.id, name)} className="btn btn-primary btn-sm">
                            {t("clients.approve")}
                          </button>
                          <button type="button" onClick={() => onReject(c.id, name)} className="btn btn-danger btn-sm">
                            {t("clients.reject")}
                          </button>
                        </>
                      )}
                      {c.status === "RECHAZADO" && canUpdate && (
                        <button type="button" onClick={() => onResubmit(c.id, name)} className="btn btn-secondary btn-sm">
                          {t("clients.resubmit")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
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
