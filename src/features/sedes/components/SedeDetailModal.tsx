"use client";

import type { ReactNode } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineNoSymbol,
  HiOutlinePencilSquare,
} from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Sede } from "@/features/sedes/types";

interface SedeDetailModalProps {
  sede: Sede;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (sede: Sede) => void;
  onDeactivate: (sede: Sede) => void;
  onReactivate: (sede: Sede) => void;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:items-start sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SedeDetailModal({
  sede,
  canUpdate,
  canDelete,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
}: SedeDetailModalProps) {
  const { t, locale } = useTranslation();

  const headerActions = (
    <>
      {canUpdate ? (
        <IconActionButton
          label={t("common.edit")}
          icon={<HiOutlinePencilSquare className="h-4 w-4" />}
          onClick={() => onEdit(sede)}
        />
      ) : null}
      {canDelete && sede.is_active ? (
        <IconActionButton
          label={t("sedes.deactivate")}
          icon={<HiOutlineNoSymbol className="h-4 w-4" />}
          variant="danger"
          onClick={() => onDeactivate(sede)}
        />
      ) : null}
      {canUpdate && !sede.is_active ? (
        <IconActionButton
          label={t("sedes.reactivate")}
          icon={<HiOutlineArrowPath className="h-4 w-4" />}
          variant="primary"
          onClick={() => onReactivate(sede)}
        />
      ) : null}
    </>
  );

  return (
    <Modal
      title={sede.name}
      subtitle={sede.code}
      headerActions={headerActions}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-5">
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-slate-100">
          {sede.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sede.avatar_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/20 via-cream-100 to-slate-200">
              <span className="text-xl font-bold tracking-wide text-brand/70">
                {sede.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <dl className="space-y-3.5">
          <DetailRow
            label={t("sedes.description")}
            value={sede.description?.trim() || t("common.dash")}
          />
          <DetailRow label={t("common.status")} value={<ActiveBadge active={sede.is_active} />} />
          <DetailRow
            label={t("common.createdAt")}
            value={formatDateTime(sede.created_at, locale) ?? t("common.dash")}
          />
        </dl>
      </div>
    </Modal>
  );
}
