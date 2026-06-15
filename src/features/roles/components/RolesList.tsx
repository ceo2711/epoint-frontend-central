"use client";

import { ActiveBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Role } from "@/features/roles/types";

interface RolesListProps {
  roles: Role[];
}

export function RolesList({ roles }: RolesListProps) {
  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <Card key={role.id} className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">{role.name}</h3>
              <p className="font-mono text-xs text-slate-400">{role.code}</p>
            </div>
            <ActiveBadge active={role.is_active} />
          </div>
          {role.description && (
            <p className="mt-2 text-sm text-slate-500">{role.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {role.permissions.map((perm) => (
              <span key={perm.id} className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                {perm.code}
              </span>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
