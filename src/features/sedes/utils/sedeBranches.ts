import type { CalendlySalesRep } from "@/features/calendly/types";
import type { SedeBranchCard } from "@/features/sedes/components/SedeBranchList";
import type { Sede } from "@/features/sedes/types";

/** Agrupa vendedores por sede; si hay listado de sedes (admin global), las incluye todas. */
export function buildSedeBranchesFromReps(
  salesReps: CalendlySalesRep[],
  sedes: Sede[],
  options: {
    includeAllSedes: boolean;
    fallbackName: string;
  },
): SedeBranchCard[] {
  const { includeAllSedes, fallbackName } = options;
  const countBySede = new Map<number, number>();
  for (const rep of salesReps) {
    if (rep.sede_id == null) continue;
    countBySede.set(rep.sede_id, (countBySede.get(rep.sede_id) ?? 0) + 1);
  }

  if (includeAllSedes && sedes.length > 0) {
    return sedes
      .filter((sede) => sede.is_active)
      .map((sede) => ({
        id: sede.id,
        name: sede.name,
        description: sede.description,
        avatarUrl: sede.avatar_url ?? null,
        repCount: countBySede.get(sede.id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const fromReps = new Map<number, SedeBranchCard>();
  for (const rep of salesReps) {
    if (rep.sede_id == null) continue;
    const existing = fromReps.get(rep.sede_id);
    if (existing) {
      existing.repCount += 1;
    } else {
      fromReps.set(rep.sede_id, {
        id: rep.sede_id,
        name: rep.sede_name ?? fallbackName,
        repCount: 1,
      });
    }
  }
  return Array.from(fromReps.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function filterRepsBySede(
  salesReps: CalendlySalesRep[],
  sedeId: number | null,
  options: { filterBySede: boolean },
): CalendlySalesRep[] {
  if (!options.filterBySede || sedeId == null) return salesReps;
  return salesReps.filter((rep) => rep.sede_id === sedeId);
}
