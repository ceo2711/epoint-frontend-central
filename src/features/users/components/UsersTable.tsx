"use client";

import { HiOutlineNoSymbol, HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/contexts/LanguageContext";
import type { User } from "@/features/users/types";

const SYSTEM_STAFF_EMAIL = "system@epoint.com";

interface UsersTableProps {
  users: User[];
  currentUserId?: number;
  canUpdate: boolean;
  canDelete: boolean;
  /** Solo administrador global: borrado permanente de empleados. */
  canPurge?: boolean;
  /** Solo admin global: el gerente ya ve solo su sede. */
  showSedeColumn?: boolean;
  onSelect: (user: User) => void;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function UsersTable({
  users,
  currentUserId,
  canUpdate,
  canDelete,
  canPurge = false,
  showSedeColumn = true,
  onSelect,
  onEdit,
  onDeactivate,
  onDelete,
}: UsersTableProps) {
  const { t } = useTranslation();
  const showActionsColumn = canUpdate || canDelete || canPurge;

  function renderActions(user: User) {
    if (user.id === currentUserId) {
      return t("common.dash");
    }

    const showEdit = canUpdate && user.is_active;
    const showDeactivate = canDelete && user.is_active;
    const showDelete =
      canPurge && Boolean(onDelete) && user.email.toLowerCase() !== SYSTEM_STAFF_EMAIL;
    if (!showEdit && !showDeactivate && !showDelete) {
      return t("common.dash");
    }

    return (
      <TableActions>
        {showEdit ? (
          <IconActionButton
            label={t("common.edit")}
            icon={<HiOutlinePencilSquare />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
          />
        ) : null}
        {showDeactivate ? (
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
        {showDelete ? (
          <IconActionButton
            label={t("users.delete")}
            icon={<HiOutlineTrash />}
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(user);
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
              {showSedeColumn ? (
                <span className="text-sm text-slate-600">{user.sede?.name ?? t("common.dash")}</span>
              ) : null}
              <span className="text-sm text-slate-600">{user.area?.name ?? t("common.dash")}</span>
              <ActiveBadge active={user.is_active} />
            </div>
            {showActionsColumn && user.id !== currentUserId ? (
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
              {showSedeColumn ? <th>{t("users.sede")}</th> : null}
              <th>{t("common.area")}</th>
              <th>{t("common.status")}</th>
              {showActionsColumn && <th>{t("common.actions")}</th>}
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
                {showSedeColumn ? <td>{user.sede?.name ?? t("common.dash")}</td> : null}
                <td>{user.area?.name ?? t("common.dash")}</td>
                <td>
                  <ActiveBadge active={user.is_active} />
                </td>
                {showActionsColumn && (
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
