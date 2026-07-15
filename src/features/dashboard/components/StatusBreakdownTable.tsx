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

interface StatusBreakdownRow {
  status: string;
  label: string;
  count: number;
  share: number;
}

const columnHelper = createColumnHelper<StatusBreakdownRow>();

export function StatusBreakdownTable({ data }: { data: StatusCount[] }) {
  const { t } = useTranslation();
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const rows = useMemo<StatusBreakdownRow[]>(
    () =>
      data.map((item) => ({
        status: item.status,
        label: CLIENT_STATUS_LABELS[item.status] ?? item.status,
        count: item.count,
        share: total > 0 ? Math.round((item.count / total) * 100) : 0,
      })),
    [data, total],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("label", {
        header: t("dashboard.tableStatus"),
        cell: (info) => <span className="font-medium text-slate-800">{info.getValue()}</span>,
      }),
      columnHelper.accessor("count", {
        header: t("dashboard.tableClients"),
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
    [t],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="card-flat overflow-hidden">
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
