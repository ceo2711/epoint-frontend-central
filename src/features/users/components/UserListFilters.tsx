"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import type { Role } from "@/features/roles/types";
import type { Sede } from "@/features/sedes/types";

interface UserListFiltersProps {
  search: string;
  sedeId: number | null;
  roleId: number | null;
  sedes: Sede[];
  roles: Role[];
  showSedeFilter: boolean;
  onSearchChange: (value: string) => void;
  onSedeFilterChange: (value: number | null) => void;
  onRoleFilterChange: (value: number | null) => void;
}

export function UserListFilters({
  search,
  sedeId,
  roleId,
  sedes,
  roles,
  showSedeFilter,
  onSearchChange,
  onSedeFilterChange,
  onRoleFilterChange,
}: UserListFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 sm:max-w-xs lg:max-w-sm">
        <label htmlFor="users-search" className="input-label mb-1">
          {t("users.searchByName")}
        </label>
        <input
          id="users-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("users.searchByNamePlaceholder")}
          className="input-field py-2"
          autoComplete="off"
        />
      </div>

      <div className="w-full sm:w-auto sm:min-w-[12rem]">
        <label htmlFor="users-role-filter" className="input-label mb-1">
          {t("common.role")}
        </label>
        <select
          id="users-role-filter"
          value={roleId == null ? "all" : String(roleId)}
          onChange={(event) => {
            const value = event.target.value;
            onRoleFilterChange(value === "all" ? null : Number(value));
          }}
          className="input-field py-2"
        >
          <option value="all">{t("users.allRoles")}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {showSedeFilter ? (
        <div className="w-full sm:w-auto sm:min-w-[12rem]">
          <label htmlFor="users-sede-filter" className="input-label mb-1">
            {t("users.sede")}
          </label>
          <select
            id="users-sede-filter"
            value={sedeId == null ? "all" : String(sedeId)}
            onChange={(event) => {
              const value = event.target.value;
              onSedeFilterChange(value === "all" ? null : Number(value));
            }}
            className="input-field py-2"
          >
            <option value="all">{t("users.allSedes")}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
