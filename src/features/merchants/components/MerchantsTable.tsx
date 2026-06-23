"use client";

import { ActiveBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Merchant } from "@/features/merchants/types";

interface MerchantsTableProps {
  merchants: Merchant[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (merchant: Merchant) => void;
  onDeactivate: (merchant: Merchant) => void;
}

export function MerchantsTable({
  merchants,
  canUpdate,
  canDelete,
  onEdit,
  onDeactivate,
}: MerchantsTableProps) {
  const { t } = useTranslation();

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
              {canUpdate && merchant.is_active && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(merchant)}>
                  {t("common.edit")}
                </button>
              )}
              {canDelete && merchant.is_active && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeactivate(merchant)}>
                  {t("merchants.deactivate")}
                </button>
              )}
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
                <td>
                  <div className="flex flex-wrap gap-2">
                    {canUpdate && merchant.is_active && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(merchant)}>
                        {t("common.edit")}
                      </button>
                    )}
                    {canDelete && merchant.is_active && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeactivate(merchant)}>
                        {t("merchants.deactivate")}
                      </button>
                    )}
                  </div>
                </td>
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
