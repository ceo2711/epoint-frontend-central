"use client";

import {
  HiOutlineArrowPath,
  HiOutlineNoSymbol,
  HiOutlinePencilSquare,
} from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Sede } from "@/features/sedes/types";

interface SedesTableProps {
  sedes: Sede[];
  canUpdate: boolean;
  canDelete: boolean;
  onSelect: (sede: Sede) => void;
  onEdit: (sede: Sede) => void;
  onDeactivate: (sede: Sede) => void;
  onReactivate: (sede: Sede) => void;
}

export function SedesTable({
  sedes,
  canUpdate,
  canDelete,
  onSelect,
  onEdit,
  onDeactivate,
  onReactivate,
}: SedesTableProps) {
  const { t } = useTranslation();

  function renderActions(sede: Sede) {
    return (
      <TableActions>
        {canUpdate ? (
          <IconActionButton
            label={t("common.edit")}
            icon={<HiOutlinePencilSquare />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(sede);
            }}
          />
        ) : null}
        {canDelete && sede.is_active ? (
          <IconActionButton
            label={t("sedes.deactivate")}
            icon={<HiOutlineNoSymbol />}
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate(sede);
            }}
          />
        ) : null}
        {canUpdate && !sede.is_active ? (
          <IconActionButton
            label={t("sedes.reactivate")}
            icon={<HiOutlineArrowPath />}
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onReactivate(sede);
            }}
          />
        ) : null}
      </TableActions>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {sedes.map((sede) => (
          <div
            key={sede.id}
            className="card-flat cursor-pointer p-4 transition hover:border-brand/30 hover:shadow-md"
            onClick={() => onSelect(sede)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(sede);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start gap-3">
              {sede.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sede.avatar_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-200"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {sede.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{sede.name}</p>
                <p className="mt-1 text-sm text-slate-500">{sede.code}</p>
              </div>
            </div>
            {sede.description ? (
              <p className="mt-2 text-sm text-slate-600">{sede.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ActiveBadge active={sede.is_active} />
            </div>
            {(canUpdate || canDelete) ? (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                {renderActions(sede)}
              </div>
            ) : null}
          </div>
        ))}
        {sedes.length === 0 ? (
          <div className="card-flat p-8 text-center text-slate-400">{t("sedes.empty")}</div>
        ) : null}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("sedes.code")}</th>
              <th>{t("sedes.description")}</th>
              <th>{t("common.status")}</th>
              {(canUpdate || canDelete) ? <th>{t("common.actions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {sedes.map((sede) => (
              <tr
                key={sede.id}
                className="cursor-pointer transition hover:bg-cream-100/80"
                onClick={() => onSelect(sede)}
              >
                <td>
                  <div className="flex min-w-0 items-center gap-3">
                    {sede.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sede.avatar_url}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                        {sede.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate font-semibold text-slate-800">{sede.name}</span>
                  </div>
                </td>
                <td className="text-slate-500">{sede.code}</td>
                <td className="text-slate-500">{sede.description ?? t("common.dash")}</td>
                <td>
                  <ActiveBadge active={sede.is_active} />
                </td>
                {(canUpdate || canDelete) ? (
                  <td onClick={(e) => e.stopPropagation()}>{renderActions(sede)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {sedes.length === 0 ? (
          <div className="card-flat p-8 text-center text-slate-400">{t("sedes.empty")}</div>
        ) : null}
      </div>
    </>
  );
}
