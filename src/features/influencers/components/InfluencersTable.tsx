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
import type { Influencer } from "@/features/influencers/types";

interface InfluencersTableProps {
  influencers: Influencer[];
  onEdit: (influencer: Influencer) => void;
  onDeactivate: (influencer: Influencer) => void;
  onReactivate: (influencer: Influencer) => void;
}

export function InfluencersTable({
  influencers,
  onEdit,
  onDeactivate,
  onReactivate,
}: InfluencersTableProps) {
  const { t } = useTranslation();

  function renderActions(influencer: Influencer) {
    return (
      <TableActions>
        <IconActionButton
          label={t("common.edit")}
          icon={<HiOutlinePencilSquare />}
          onClick={() => onEdit(influencer)}
        />
        {influencer.is_active ? (
          <IconActionButton
            label={t("influencers.deactivate")}
            icon={<HiOutlineNoSymbol />}
            variant="danger"
            onClick={() => onDeactivate(influencer)}
          />
        ) : (
          <IconActionButton
            label={t("influencers.reactivate")}
            icon={<HiOutlineArrowPath />}
            variant="primary"
            onClick={() => onReactivate(influencer)}
          />
        )}
      </TableActions>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {influencers.map((influencer) => (
          <Card key={influencer.id} className="p-4">
            <p className="font-semibold text-slate-800">{influencer.name}</p>
            {influencer.handle ? (
              <p className="mt-1 text-sm text-slate-500">{influencer.handle}</p>
            ) : null}
            <p className="mt-2 text-sm text-slate-600">
              {t("influencers.salesRep")}: {influencer.sales_rep_name ?? t("common.dash")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ActiveBadge active={influencer.is_active} />
              {renderActions(influencer)}
            </div>
          </Card>
        ))}
        {influencers.length === 0 && (
          <Card className="p-8 text-center text-slate-400">{t("influencers.empty")}</Card>
        )}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("influencers.handle")}</th>
              <th>{t("influencers.salesRep")}</th>
              <th>{t("users.sede")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {influencers.map((influencer) => (
              <tr key={influencer.id}>
                <td className="font-semibold text-slate-800">{influencer.name}</td>
                <td className="text-slate-500">{influencer.handle ?? t("common.dash")}</td>
                <td className="text-slate-500">{influencer.sales_rep_name ?? t("common.dash")}</td>
                <td className="text-slate-500">{influencer.sede_name ?? t("common.dash")}</td>
                <td>
                  <ActiveBadge active={influencer.is_active} />
                </td>
                <td>{renderActions(influencer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {influencers.length === 0 && (
          <Card className="p-8 text-center text-slate-400">{t("influencers.empty")}</Card>
        )}
      </div>
    </>
  );
}
