"use client";

import type { ReactNode } from "react";
import { HiOutlineArrowPath, HiOutlineNoSymbol, HiOutlinePencilSquare } from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { Modal } from "@/components/ui/Modal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/contexts/LanguageContext";
import type { User } from "@/features/users/types";

interface UserDetailModalProps {
  user: User;
  currentUserId?: number;
  canUpdate: boolean;
  canDelete: boolean;
  canReassignSubSeller?: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onReassignSubSeller?: (user: User) => void;
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

export function UserDetailModal({
  user,
  currentUserId,
  canUpdate,
  canDelete,
  canReassignSubSeller = false,
  onClose,
  onEdit,
  onDeactivate,
  onReassignSubSeller,
}: UserDetailModalProps) {
  const { t, locale } = useTranslation();
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const canManage = user.is_active && user.id !== currentUserId;
  const showEdit = canUpdate && canManage;
  const showDeactivate = canDelete && canManage;
  const isSubSeller =
    user.role.code === "SUB_SELLER" || user.parent_user_id != null || Boolean(user.is_sub_seller);
  const showReassign = Boolean(canReassignSubSeller && isSubSeller && onReassignSubSeller);
  const parent = user.parent ?? null;
  const parentName = parent
    ? `${parent.first_name} ${parent.last_name}`.trim() || parent.email
    : null;

  const headerActions =
    showEdit || showDeactivate || showReassign ? (
      <>
        {showReassign ? (
          <IconActionButton
            label={t("subSellers.reassignAction")}
            icon={<HiOutlineArrowPath className="h-4 w-4" />}
            onClick={() => onReassignSubSeller?.(user)}
          />
        ) : null}
        {showEdit ? (
          <IconActionButton
            label={t("common.edit")}
            icon={<HiOutlinePencilSquare className="h-4 w-4" />}
            onClick={() => onEdit(user)}
          />
        ) : null}
        {showDeactivate ? (
          <IconActionButton
            label={t("users.deactivate")}
            icon={<HiOutlineNoSymbol className="h-4 w-4" />}
            variant="danger"
            onClick={() => onDeactivate(user)}
          />
        ) : null}
      </>
    ) : null;

  return (
    <Modal
      title={fullName || t("users.title")}
      subtitle={user.email}
      headerActions={headerActions}
      onClose={onClose}
      size="lg"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <UserAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          avatarUrl={user.avatar_url}
          size="lg"
        />
        <dl className="min-w-0 flex-1 space-y-3.5">
          <DetailRow label={t("common.email")} value={<span className="break-all">{user.email}</span>} />
          <DetailRow label={t("common.phone")} value={user.phone?.trim() || t("common.dash")} />
          <DetailRow
            label={t("common.role")}
            value={<span className="badge badge-blue">{user.role.name}</span>}
          />
          {parent && parentName ? (
            <DetailRow
              label={t("users.teamOwner")}
              value={
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{parentName}</p>
                  <p className="break-all text-xs text-slate-500">{parent.email}</p>
                </div>
              }
            />
          ) : null}
          <DetailRow label={t("users.sede")} value={user.sede?.name ?? t("common.dash")} />
          <DetailRow label={t("common.area")} value={user.area?.name ?? t("common.dash")} />
          <DetailRow label={t("common.status")} value={<ActiveBadge active={user.is_active} />} />
          <DetailRow
            label={t("users.lastLogin")}
            value={formatDateTime(user.last_login_at, locale) ?? t("common.dash")}
          />
          <DetailRow
            label={t("common.createdAt")}
            value={formatDateTime(user.created_at, locale) ?? t("common.dash")}
          />
          {showReassign ? (
            <div className="pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => onReassignSubSeller?.(user)}>
                {t("subSellers.reassignAction")}
              </Button>
            </div>
          ) : null}
        </dl>
      </div>
    </Modal>
  );
}
