"use client";

import Link from "next/link";

import { ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { Prospect } from "@/features/prospects/types";
import { useTranslation } from "@/contexts/LanguageContext";

interface ProspectListProps {
  prospects: Prospect[];
}

export function ProspectList({ prospects }: ProspectListProps) {
  const { t } = useTranslation();

  if (prospects.length === 0) {
    return (
      <div className="card-flat p-8 text-center text-sm text-slate-500">{t("prospects.empty")}</div>
    );
  }

  return (
    <div className="card-flat overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">{t("prospects.columns.name")}</th>
            <th className="px-4 py-3">{t("common.email")}</th>
            <th className="px-4 py-3">{t("prospects.columns.merchant")}</th>
            <th className="px-4 py-3">{t("prospects.columns.salesRep")}</th>
            <th className="px-4 py-3">{t("prospects.columns.status")}</th>
            <th className="px-4 py-3">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {prospects.map((prospect) => (
            <tr key={prospect.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-medium text-slate-900">{prospect.full_name}</td>
              <td className="px-4 py-3 text-slate-600">{prospect.email}</td>
              <td className="px-4 py-3 text-slate-600">{prospect.merchant_name ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                {prospect.assigned_to
                  ? `${prospect.assigned_to.first_name} ${prospect.assigned_to.last_name}`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <ProspectStatusBadge status={prospect.status} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/prospectos/${prospect.id}`}
                  className="font-medium text-brand hover:text-brand-dark"
                >
                  {t("common.view")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
