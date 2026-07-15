"use client";

import { HiOutlineNoSymbol, HiOutlinePencilSquare } from "react-icons/hi2";

import { ActiveBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { User } from "@/features/users/types";

interface UsersTableProps {
  users: User[];
  currentUserId?: number;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
}

export function UsersTable({
  users,
  currentUserId,
  canUpdate,
  canDelete,
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
            onClick={() => onEdit(user)}
          />
        ) : null}
        {canDelete ? (
          <IconActionButton
            label={t("users.deactivate")}
            icon={<HiOutlineNoSymbol />}
            variant="danger"
            onClick={() => onDeactivate(user)}
          />
        ) : null}
      </TableActions>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <p className="font-semibold text-slate-800">
              {user.first_name} {user.last_name}
            </p>
            <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="badge badge-blue">{user.role.name}</span>
              <span className="text-sm text-slate-600">{user.area?.name ?? t("common.dash")}</span>
              <ActiveBadge active={user.is_active} />
            </div>
            {(canUpdate || canDelete) && user.is_active && user.id !== currentUserId ? (
              <div className="mt-3">{renderActions(user)}</div>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.email")}</th>
              <th>{t("common.role")}</th>
              <th>{t("common.area")}</th>
              <th>{t("common.status")}</th>
              {(canUpdate || canDelete) && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-semibold text-slate-800">
                  {user.first_name} {user.last_name}
                </td>
                <td className="text-slate-500">{user.email}</td>
                <td>
                  <span className="badge badge-blue">{user.role.name}</span>
                </td>
                <td>{user.area?.name ?? t("common.dash")}</td>
                <td><ActiveBadge active={user.is_active} /></td>
                {(canUpdate || canDelete) && <td>{renderActions(user)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
