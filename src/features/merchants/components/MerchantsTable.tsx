"use client";

import {
  HiOutlineArrowPath,
  HiOutlineNoSymbol,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Merchant } from "@/features/merchants/types";

interface MerchantsTableProps {
  merchants: Merchant[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (merchant: Merchant) => void;
  onDeactivate: (merchant: Merchant) => void;
  onReactivate: (merchant: Merchant) => void;
  onDelete: (merchant: Merchant) => void;
}

export function MerchantsTable({
  merchants,
  canUpdate,
  canDelete,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
}: MerchantsTableProps) {
  const { t } = useTranslation();

  function renderActions(merchant: Merchant) {
    return (
      <TableActions>
        {canUpdate ? (
          <IconActionButton
            label={t("common.edit")}
            icon={<HiOutlinePencilSquare />}
            onClick={() => onEdit(merchant)}
          />
        ) : null}
        {canDelete && merchant.is_active ? (
          <IconActionButton
            label={t("merchants.deactivate")}
            icon={<HiOutlineNoSymbol />}
            variant="danger"
            onClick={() => onDeactivate(merchant)}
          />
        ) : null}
        {canUpdate && !merchant.is_active ? (
          <IconActionButton
            label={t("merchants.reactivate")}
            icon={<HiOutlineArrowPath />}
            variant="primary"
            onClick={() => onReactivate(merchant)}
          />
        ) : null}
        {canDelete && !merchant.is_active ? (
          <IconActionButton
            label={t("merchants.delete")}
            icon={<HiOutlineTrash />}
            variant="danger"
            onClick={() => onDelete(merchant)}
          />
        ) : null}
      </TableActions>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {merchants.map((merchant) => (
          <Card key={merchant.id} className="p-4">
            <p className="font-semibold text-slate-800">{merchant.name}</p>
            <p className="mt-1 text-sm text-slate-500">{merchant.code}</p>
            {merchant.description && (
              <p className="mt-2 text-sm text-slate-600">{merchant.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ActiveBadge active={merchant.is_active} />
              {renderActions(merchant)}
            </div>
          </Card>
        ))}
        {merchants.length === 0 && (
          <Card className="p-8 text-center text-slate-400">{t("merchants.empty")}</Card>
        )}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("merchants.code")}</th>
              <th>{t("merchants.description")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr key={merchant.id}>
                <td className="font-semibold text-slate-800">{merchant.name}</td>
                <td className="text-slate-500">{merchant.code}</td>
                <td className="text-slate-500">{merchant.description ?? t("common.dash")}</td>
                <td><ActiveBadge active={merchant.is_active} /></td>
                <td>{renderActions(merchant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {merchants.length === 0 && (
          <Card className="p-8 text-center text-slate-400">{t("merchants.empty")}</Card>
        )}
      </div>
    </>
  );
}
