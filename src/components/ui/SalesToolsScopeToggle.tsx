"use client";

import { useTranslation } from "@/contexts/LanguageContext";

export type SalesToolsScope = "own" | "team";

interface SalesToolsScopeToggleProps {
  value: SalesToolsScope;
  onChange: (value: SalesToolsScope) => void;
}

/** Switch deslizante Yo / Equipo para líderes de ventas. */
export function SalesToolsScopeToggle({ value, onChange }: SalesToolsScopeToggleProps) {
  const { t } = useTranslation();
  const teamActive = value === "team";

  return (
    <div
      className="relative inline-grid grid-cols-2 rounded-full border border-cream-600 bg-cream-500 p-1 shadow-[inset_0_1px_2px_rgba(26,16,8,0.06)]"
      role="tablist"
      aria-label={t("common.teamTools")}
    >
      {/* Thumb deslizante */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-brand shadow-sm ring-1 ring-brand-dark/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          teamActive ? "translate-x-full" : "translate-x-0"
        }`}
      />

      <button
        type="button"
        role="tab"
        aria-selected={!teamActive}
        onClick={() => onChange("own")}
        className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-colors duration-300 ${
          !teamActive ? "text-white" : "text-brown-700 hover:text-brown-900"
        }`}
      >
        {t("common.myTools")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={teamActive}
        onClick={() => onChange("team")}
        className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-colors duration-300 ${
          teamActive ? "text-white" : "text-brown-700 hover:text-brown-900"
        }`}
      >
        {t("common.teamTools")}
      </button>
    </div>
  );
}
