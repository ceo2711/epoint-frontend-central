"use client";

import {
  HiOutlineArrowPath,
  HiOutlineNoSymbol,
  HiOutlinePencilSquare,
} from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Sede } from "@/features/sedes/types";

interface SedesTableProps {
  sedes: Sede[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (sede: Sede) => void;
  onDeactivate: (sede: Sede) => void;
  onReactivate: (sede: Sede) => void;
}

export function SedesTable({
  sedes,
  canUpdate,
  canDelete,
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
            onClick={() => onEdit(sede)}
          />
        ) : null}
        {canDelete && sede.is_active ? (
          <IconActionButton
            label={t("sedes.deactivate")}
            icon={<HiOutlineNoSymbol />}
            variant="danger"
            onClick={() => onDeactivate(sede)}
          />
        ) : null}
        {canUpdate && !sede.is_active ? (
          <IconActionButton
            label={t("sedes.reactivate")}
            icon={<HiOutlineArrowPath />}
            variant="primary"
            onClick={() => onReactivate(sede)}
          />
        ) : null}
      </TableActions>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {sedes.map((sede) => (
          <Card key={sede.id} className="p-4">
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
              {renderActions(sede)}
            </div>
          </Card>
        ))}
        {sedes.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">{t("sedes.empty")}</Card>
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
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {sedes.map((sede) => (
              <tr key={sede.id}>
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
                <td><ActiveBadge active={sede.is_active} /></td>
                <td>{renderActions(sede)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sedes.length === 0 ? (
          <Card className="p-8 text-center text-slate-400">{t("sedes.empty")}</Card>
        ) : null}
      </div>
    </>
  );
}
