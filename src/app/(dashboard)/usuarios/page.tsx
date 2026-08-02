"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAreas } from "@/features/areas/hooks/useAreas";
import { useRoles } from "@/features/roles/hooks/useRoles";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import { SalesLeaderVendorsPage } from "@/features/users/components/SalesLeaderVendorsPage";
import { UserDetailModal } from "@/features/users/components/UserDetailModal";
import { UserFormModal } from "@/features/users/components/UserFormModal";
import { UserListFilters } from "@/features/users/components/UserListFilters";
import { UsersTable } from "@/features/users/components/UsersTable";
import { useUsers } from "@/features/users/hooks/useUsers";
import type { User } from "@/features/users/types";
import { invalidateStaffDirectoryCaches } from "@/lib/invalidateStaffCaches";
import { canSuperviseSalesReps, isGlobalAdmin, isSalesAreaLeader } from "@/lib/roles";
import { api } from "@/lib/api";
import { ReassignSubSellerModal } from "@/features/users/components/ReassignSubSellerModal";

const HIDDEN_FILTER_ROLE_CODES = new Set([
  "ADMIN",
  "BRANCH_MANAGER",
  "CLIENT",
  "ONBOARDING_MANAGER",
]);

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const { token, hasPermission, user: currentUser } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const showSedeFilter = isGlobalAdmin(currentUser?.role.code);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sedeId, setSedeId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { users, loading, error, reload } = useUsers(
    token,
    hasPermission("users:read") && !isSalesAreaLeader(currentUser),
    t("users.loadError"),
    t("users.noPermission"),
    {
      search: debouncedSearch,
      sedeId: showSedeFilter ? sedeId : null,
      roleId,
    },
  );
  const { roles } = useRoles(token, hasPermission("roles:read"), "", "");
  const { areas } = useAreas(token, hasPermission("areas:read"), "", "");
  const filterRoles = useMemo(
    () =>
      roles
        .filter((role) => role.is_active !== false && !HIDDEN_FILTER_ROLE_CODES.has(role.code))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [roles],
  );
  const { sedes } = useSedes(
    token,
    hasPermission("sedes:read"),
    t("sedes.loadError"),
    "",
    false,
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);
  const [reassigning, setReassigning] = useState<User | null>(null);
  const canReassign = canSuperviseSalesReps(currentUser);

  if (isSalesAreaLeader(currentUser)) {
    return <SalesLeaderVendorsPage />;
  }

  function openCreate() {
    setEditing(null);
    setViewing(null);
    setModalMode("create");
  }

  function openEdit(user: User) {
    setViewing(null);
    setEditing(user);
    setModalMode("edit");
  }

  function openDetail(user: User) {
    setViewing(user);
  }

  function closeFormModal() {
    setModalMode(null);
    setEditing(null);
  }

  function closeDetailModal() {
    setViewing(null);
  }

  async function handleDeactivate(user: User) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("users.deactivateTitle"),
      message: t("users.deactivateConfirm", { name: `${user.first_name} ${user.last_name}` }),
      confirmLabel: t("users.deactivate"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/users/${user.id}`, token);
      setViewing(null);
      await invalidateStaffDirectoryCaches(queryClient);
      await reload();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  return (
    <>
      <Header title={t("users.headerContext")} subtitle={t("users.subtitle")} />
      <PageContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <UserListFilters
            search={searchInput}
            sedeId={sedeId}
            roleId={roleId}
            sedes={sedes}
            roles={filterRoles}
            showSedeFilter={showSedeFilter}
            onSearchChange={setSearchInput}
            onSedeFilterChange={setSedeId}
            onRoleFilterChange={setRoleId}
          />
          {hasPermission("users:create") ? (
            <Button size="sm" onClick={openCreate} className="shrink-0 self-end sm:self-auto">
              {t("users.add")}
            </Button>
          ) : null}
        </div>
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && (
          <UsersTable
            users={users}
            currentUserId={currentUser?.id}
            canUpdate={hasPermission("users:update")}
            canDelete={hasPermission("users:delete")}
            showSedeColumn={showSedeFilter}
            onSelect={openDetail}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
          />
        )}
      </PageContent>

      {viewing ? (
        <UserDetailModal
          user={viewing}
          currentUserId={currentUser?.id}
          canUpdate={hasPermission("users:update")}
          canDelete={hasPermission("users:delete")}
          canReassignSubSeller={canReassign}
          onClose={closeDetailModal}
          onEdit={openEdit}
          onDeactivate={handleDeactivate}
          onReassignSubSeller={(user) => {
            setViewing(null);
            setReassigning(user);
          }}
        />
      ) : null}

      {reassigning && token ? (
        <ReassignSubSellerModal
          token={token}
          subSeller={reassigning}
          onClose={() => setReassigning(null)}
          onSuccess={async () => {
            setReassigning(null);
            await invalidateStaffDirectoryCaches(queryClient);
            await reload();
          }}
        />
      ) : null}

      {modalMode && hasPermission(modalMode === "edit" ? "users:update" : "users:create") ? (
        <UserFormModal
          token={token}
          roles={roles}
          areas={areas}
          sedes={sedes}
          user={modalMode === "edit" ? editing : null}
          onClose={closeFormModal}
          onSuccess={() => void reload()}
        />
      ) : null}
    </>
  );
}
