"use client";

import { VscChevronRight } from "react-icons/vsc";

import { useTranslation } from "@/contexts/LanguageContext";

export type SedeBranchCard = {
  id: number;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  repCount: number;
};

interface SedeBranchListProps {
  branches: SedeBranchCard[];
  onSelect: (id: number) => void;
  titleKey?: string;
  hintKey?: string;
  emptyKey?: string;
  countLabelKey?: string;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function SedeBranchList({
  branches,
  onSelect,
  titleKey = "sedes.branchesTitle",
  hintKey = "sedes.branchesHint",
  emptyKey = "sedes.branchesEmpty",
  countLabelKey = "sedes.branchRepCount",
}: SedeBranchListProps) {
  const { t } = useTranslation();

  if (branches.length === 0) {
    return (
      <div className="card-flat p-8 text-center text-sm text-slate-500">
        {t(emptyKey)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t(titleKey)}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t(hintKey)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <button
            key={branch.id}
            type="button"
            onClick={() => onSelect(branch.id)}
            className="group flex min-h-[9.5rem] flex-col rounded-2xl border border-cream-600 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <div className="flex items-start justify-between gap-3">
              {branch.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branch.avatarUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-brand/15"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {initialsFor(branch.name)}
                </div>
              )}
              <VscChevronRight
                className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand"
                aria-hidden
              />
            </div>

            <div className="mt-4 min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-slate-900">{branch.name}</p>
              {branch.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{branch.description}</p>
              ) : null}
            </div>

            <span className="mt-4 text-xs font-medium text-slate-400 transition group-hover:text-brand">
              {t(countLabelKey, { count: branch.repCount })} →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
