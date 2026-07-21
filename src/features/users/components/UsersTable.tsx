"use client";

import { HiOutlineNoSymbol, HiOutlinePencilSquare } from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/contexts/LanguageContext";
import type { User } from "@/features/users/types";

interface UsersTableProps {
  users: User[];
  currentUserId?: number;
  canUpdate: boolean;
  canDelete: boolean;
  onSelect: (user: User) => void;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
}

export function UsersTable({
  users,
  currentUserId,
  canUpdate,
  canDelete,
  onSelect,
  onEdit,
  onDeactivate,
}: UsersTableProps) {
  const { t } = useTranslation();

  function renderActions(user: User) {
    if (!user.is_active || user.id === currentUserId) {
      return t("common.dash");
    }

    return (
      <TableActions>
        {canUpdate ? (
          <IconActionButton
            label={t("common.edit")}
            icon={<HiOutlinePencilSquare />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
          />
        ) : null}
        {canDelete ? (
          <IconActionButton
            label={t("users.deactivate")}
            icon={<HiOutlineNoSymbol />}
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate(user);
            }}
          />
        ) : null}
      </TableActions>
    );
  }

  function renderName(user: User) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          avatarUrl={user.avatar_url}
          size="sm"
        />
        <span className="truncate font-semibold text-slate-800">
          {user.first_name} {user.last_name}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="card-flat cursor-pointer p-4 transition hover:border-brand/30 hover:shadow-md"
            onClick={() => onSelect(user)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(user);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {renderName(user)}
            <p className="mt-2 break-all text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="badge badge-blue">{user.role.name}</span>
              <span className="text-sm text-slate-600">{user.sede?.name ?? t("common.dash")}</span>
              <span className="text-sm text-slate-600">{user.area?.name ?? t("common.dash")}</span>
              <ActiveBadge active={user.is_active} />
            </div>
            {(canUpdate || canDelete) && user.is_active && user.id !== currentUserId ? (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                {renderActions(user)}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.email")}</th>
              <th>{t("common.role")}</th>
              <th>{t("users.sede")}</th>
              <th>{t("common.area")}</th>
              <th>{t("common.status")}</th>
              {(canUpdate || canDelete) && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="cursor-pointer transition hover:bg-cream-100/80"
                onClick={() => onSelect(user)}
              >
                <td>{renderName(user)}</td>
                <td className="text-slate-500">{user.email}</td>
                <td>
                  <span className="badge badge-blue">{user.role.name}</span>
                </td>
                <td>{user.sede?.name ?? t("common.dash")}</td>
                <td>{user.area?.name ?? t("common.dash")}</td>
                <td>
                  <ActiveBadge active={user.is_active} />
                </td>
                {(canUpdate || canDelete) && (
                  <td onClick={(e) => e.stopPropagation()}>{renderActions(user)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
