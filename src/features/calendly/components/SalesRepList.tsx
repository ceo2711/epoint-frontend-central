"use client";

import { useMemo } from "react";
import { VscChevronRight } from "react-icons/vsc";

import type { CalendlySalesRep } from "@/features/calendly/types";
import { useTranslation } from "@/contexts/LanguageContext";

interface SalesRepListProps {
  reps: CalendlySalesRep[];
  onSelect: (id: number) => void;
  titleKey?: string;
  hintKey?: string;
  showConnectionStatus?: boolean;
}

interface SalesRepTeam {
  lead: CalendlySalesRep;
  subSellers: CalendlySalesRep[];
}

function initialsFor(rep: CalendlySalesRep): string {
  const first = rep.first_name?.[0] ?? "";
  const last = rep.last_name?.[0] ?? "";
  const value = `${first}${last}`.trim();
  return value ? value.toUpperCase() : (rep.email?.[0] ?? "?").toUpperCase();
}

function repSortKey(rep: CalendlySalesRep): string {
  return `${rep.first_name} ${rep.last_name} ${rep.email}`.toLowerCase();
}

function groupSalesReps(reps: CalendlySalesRep[]): {
  teams: SalesRepTeam[];
  orphanSubs: CalendlySalesRep[];
} {
  const byId = new Map(reps.map((rep) => [rep.id, rep]));
  const subsByParent = new Map<number, CalendlySalesRep[]>();
  const orphanSubs: CalendlySalesRep[] = [];

  for (const rep of reps) {
    if (rep.parent_user_id == null) continue;
    if (!byId.has(rep.parent_user_id)) {
      orphanSubs.push(rep);
      continue;
    }
    const list = subsByParent.get(rep.parent_user_id) ?? [];
    list.push(rep);
    subsByParent.set(rep.parent_user_id, list);
  }

  for (const list of subsByParent.values()) {
    list.sort((a, b) => repSortKey(a).localeCompare(repSortKey(b)));
  }
  orphanSubs.sort((a, b) => repSortKey(a).localeCompare(repSortKey(b)));

  const teams: SalesRepTeam[] = reps
    .filter((rep) => rep.parent_user_id == null)
    .sort((a, b) => repSortKey(a).localeCompare(repSortKey(b)))
    .map((lead) => ({
      lead,
      subSellers: subsByParent.get(lead.id) ?? [],
    }));

  return { teams, orphanSubs };
}

function SalesRepCard({
  rep,
  onSelect,
  showConnectionStatus,
  variant,
}: {
  rep: CalendlySalesRep;
  onSelect: (id: number) => void;
  showConnectionStatus: boolean;
  variant: "lead" | "sub";
}) {
  const { t } = useTranslation();
  const isSub = variant === "sub" || rep.parent_user_id != null;

  if (isSub) {
    return (
      <button
        type="button"
        onClick={() => onSelect(rep.id)}
        className="group flex w-full max-w-[13.5rem] items-center gap-2 rounded-lg border border-slate-200 border-l-[3px] border-l-brand/60 bg-slate-50/90 px-2.5 py-2 text-left transition hover:border-brand/40 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {rep.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rep.avatar_url}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-brand/15"
          />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[9px] font-bold text-brand">
            {initialsFor(rep)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-xs font-semibold text-slate-900">
              {rep.first_name} {rep.last_name}
            </p>
          </div>
          <span className="mt-0.5 inline-flex rounded-full bg-brand/10 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-brand">
            {t("calendly.subSellerBadge")}
          </span>
          {showConnectionStatus ? (
            <p
              className={`mt-1 truncate text-[10px] font-medium ${
                rep.connected ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {rep.connected ? t("calendly.connected") : t("calendly.notConnected")}
            </p>
          ) : null}
        </div>

        <VscChevronRight
          className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-brand"
          aria-hidden
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(rep.id)}
      className="group flex min-h-[12.5rem] w-[18rem] shrink-0 flex-col rounded-2xl border border-cream-600 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className="flex items-start justify-between gap-3">
        {rep.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rep.avatar_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-brand/15"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
            {initialsFor(rep)}
          </div>
        )}
        <VscChevronRight
          className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand"
          aria-hidden
        />
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-900">
          {rep.first_name} {rep.last_name}
        </p>
        <p className="mt-1 truncate text-sm text-slate-500">{rep.email}</p>
      </div>

      {showConnectionStatus ? (
        <span
          className={`mt-auto inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            rep.connected
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {rep.connected ? t("calendly.connected") : t("calendly.notConnected")}
        </span>
      ) : (
        <span className="mt-auto text-xs font-medium text-slate-400 transition group-hover:text-brand">
          {t("common.view")} →
        </span>
      )}
    </button>
  );
}

export function SalesRepList({
  reps,
  onSelect,
  titleKey = "calendly.salesRepsTitle",
  hintKey = "calendly.salesRepsHint",
  showConnectionStatus = true,
}: SalesRepListProps) {
  const { t } = useTranslation();
  const { teams, orphanSubs } = useMemo(() => groupSalesReps(reps), [reps]);

  if (reps.length === 0) {
    return (
      <div className="card-flat p-8 text-center text-sm text-slate-500">
        {t("calendly.noSalesReps")}
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

      <div className="space-y-4">
        {teams.map(({ lead, subSellers }) => (
          <section
            key={lead.id}
            className="rounded-2xl border-2 border-accent/70 bg-slate-50/40 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <SalesRepCard
                rep={lead}
                onSelect={onSelect}
                showConnectionStatus={showConnectionStatus}
                variant="lead"
              />
              {subSellers.length > 0 ? (
                <div className="min-w-0 space-y-1.5 sm:pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {t("calendly.teamOf", {
                      name: `${lead.first_name} ${lead.last_name}`.trim(),
                      count: subSellers.length,
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subSellers.map((sub) => (
                      <SalesRepCard
                        key={sub.id}
                        rep={sub}
                        onSelect={onSelect}
                        showConnectionStatus={showConnectionStatus}
                        variant="sub"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[12.5rem] items-center sm:pt-1">
                  <p className="rounded-lg border border-dashed border-accent/50 bg-white/70 px-3 py-2 text-xs text-slate-500">
                    {t("calendly.noSubSellers")}
                  </p>
                </div>
              )}
            </div>
          </section>
        ))}

        {orphanSubs.length > 0 ? (
          <section className="rounded-2xl border-2 border-accent/70 bg-slate-50/40 p-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {t("calendly.orphanSubSellers")}
            </p>
            <div className="flex flex-wrap gap-2">
              {orphanSubs.map((sub) => (
                <SalesRepCard
                  key={sub.id}
                  rep={sub}
                  onSelect={onSelect}
                  showConnectionStatus={showConnectionStatus}
                  variant="sub"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
