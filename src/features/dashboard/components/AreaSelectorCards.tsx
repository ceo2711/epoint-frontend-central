"use client";

import type { AreaMetrics } from "@/features/dashboard/types";
import { useTranslation } from "@/contexts/LanguageContext";

const AREA_THEMES: Record<
  string,
  {
    gradient: string;
    icon: string;
    descriptionKey: "salesAreaDesc" | "salesAreaDescPersonal" | "onboardingAreaDesc";
  }
> = {
  VENTAS: {
    gradient: "from-blue-600 to-indigo-700",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    descriptionKey: "salesAreaDesc",
  },
  ONBOARDING: {
    gradient: "from-emerald-600 to-teal-700",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    descriptionKey: "onboardingAreaDesc",
  },
};

export function AreaSelectorCards({
  areas,
  onSelect,
}: {
  areas: AreaMetrics[];
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {areas.map((area) => {
        const theme = AREA_THEMES[area.code] ?? AREA_THEMES.ONBOARDING;
        const descriptionKey =
          area.code === "VENTAS" && area.scope === "personal"
            ? "salesAreaDescPersonal"
            : theme.descriptionKey;
        return (
          <button
            key={area.code}
            type="button"
            onClick={() => onSelect(area.code)}
            className="group card-flat overflow-hidden p-0 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={`bg-gradient-to-br ${theme.gradient} px-6 py-5 text-white`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    {t("dashboard.areaLabel")}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">{area.name}</h3>
                </div>
                <div className="rounded-xl bg-white/15 p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-6 w-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={theme.icon} />
                  </svg>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{t(`dashboard.${descriptionKey}`)}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 px-6 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("dashboard.totalInArea")}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{area.total}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {area.code === "VENTAS" ? t("dashboard.pendingPipeline") : t("dashboard.inPipeline")}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{area.in_pipeline}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {area.code === "VENTAS" ? t("dashboard.conversion") : t("dashboard.completedClients")}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {area.code === "VENTAS"
                    ? area.conversion_rate != null
                      ? `${area.conversion_rate}%`
                      : "—"
                    : area.completed}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-3 text-sm font-medium text-brand group-hover:text-brand-dark">
              {t("dashboard.viewMetrics")} →
            </div>
          </button>
        );
      })}
    </div>
  );
}
