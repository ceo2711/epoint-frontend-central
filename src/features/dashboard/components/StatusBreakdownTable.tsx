"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { STATUS_CHART_COLORS } from "@/features/dashboard/constants";
import type { StatusCount } from "@/features/dashboard/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { CLIENT_STATUS_LABELS } from "@/types/api";
import { PROSPECT_STATUS_ORDER } from "@/features/prospects/types";

interface StatusBreakdownRow {
  status: string;
  label: string;
  count: number;
  share: number;
}

const columnHelper = createColumnHelper<StatusBreakdownRow>();
const PROSPECT_STATUS_SET = new Set<string>(PROSPECT_STATUS_ORDER);

export function StatusBreakdownTable({
  data,
  title,
  subtitle,
  countLabel,
}: {
  data: StatusCount[];
  title?: string;
  subtitle?: string;
  countLabel?: string;
}) {
  const { t } = useTranslation();
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const entityLabel = countLabel ?? t("dashboard.tableClients");

  const rows = useMemo<StatusBreakdownRow[]>(
    () =>
      data.map((item) => ({
        status: item.status,
        label: PROSPECT_STATUS_SET.has(item.status)
          ? t(`prospects.status.${item.status}` as never)
          : (CLIENT_STATUS_LABELS[item.status] ?? item.status),
        count: item.count,
        share: total > 0 ? Math.round((item.count / total) * 100) : 0,
      })),
    [data, t, total],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("label", {
        header: t("dashboard.tableStatus"),
        cell: (info) => <span className="font-medium text-slate-800">{info.getValue()}</span>,
      }),
      columnHelper.accessor("count", {
        header: entityLabel,
        cell: (info) => <span className="tabular-nums text-slate-700">{info.getValue()}</span>,
      }),
      columnHelper.accessor("share", {
        header: t("dashboard.tableShare"),
        cell: (info) => {
          const share = info.getValue();
          const status = info.row.original.status;
          return (
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${share}%`,
                    backgroundColor: STATUS_CHART_COLORS[status] ?? "#64748b",
                  }}
                />
              </div>
              <span className="w-10 text-right tabular-nums text-slate-500">{share}%</span>
            </div>
          );
        },
      }),
    ],
    [entityLabel, t],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="card-flat overflow-hidden">
      {title ? (
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
