"use client";

import { ActiveBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Area } from "@/features/areas/types";

interface AreasGridProps {
  areas: Area[];
}

export function AreasGrid({ areas }: AreasGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {areas.map((area) => (
        <Card key={area.id} hover className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">{area.name}</h3>
              <p className="mt-1 font-mono text-xs text-slate-400">{area.code}</p>
            </div>
            <ActiveBadge active={area.is_active} />
          </div>
          {area.description && (
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{area.description}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
