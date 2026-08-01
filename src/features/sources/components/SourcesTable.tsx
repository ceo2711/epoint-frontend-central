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
import type { Source } from "@/features/sources/types";

interface SourcesTableProps {
  sources: Source[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (source: Source) => void;
  onDeactivate: (source: Source) => void;
  onReactivate: (source: Source) => void;
}

export function SourcesTable({
  sources,
  canUpdate,
  canDelete,
  onEdit,
  onDeactivate,
  onReactivate,
}: SourcesTableProps) {
  const { t } = useTranslation();

  function renderActions(source: Source) {
    return (
      <TableActions>
        {canUpdate ? (
          <IconActionButton
            label={t("common.edit")}
            icon={<HiOutlinePencilSquare />}
            onClick={() => onEdit(source)}
          />
        ) : null}
        {canDelete && source.is_active ? (
          <IconActionButton
            label={t("sources.deactivate")}
            icon={<HiOutlineNoSymbol />}
            variant="danger"
            onClick={() => onDeactivate(source)}
          />
        ) : null}
        {canUpdate && !source.is_active ? (
          <IconActionButton
            label={t("sources.reactivate")}
            icon={<HiOutlineArrowPath />}
            variant="primary"
            onClick={() => onReactivate(source)}
          />
        ) : null}
      </TableActions>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {sources.map((source) => (
          <Card key={source.id} className="p-4">
            <p className="font-semibold text-slate-800">{source.name}</p>
            <p className="mt-1 text-sm text-slate-500">{source.code}</p>
            {source.description && (
              <p className="mt-2 text-sm text-slate-600">{source.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ActiveBadge active={source.is_active} />
              {renderActions(source)}
            </div>
          </Card>
        ))}
        {sources.length === 0 && (
          <Card className="p-8 text-center text-slate-400">{t("sources.empty")}</Card>
        )}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("sources.code")}</th>
              <th>{t("sources.description")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="font-semibold text-slate-800">{source.name}</td>
                <td className="text-slate-500">{source.code}</td>
                <td className="text-slate-500">{source.description ?? t("common.dash")}</td>
                <td>
                  <ActiveBadge active={source.is_active} />
                </td>
                <td>{renderActions(source)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sources.length === 0 && (
          <Card className="p-8 text-center text-slate-400">{t("sources.empty")}</Card>
        )}
      </div>
    </>
  );
}
