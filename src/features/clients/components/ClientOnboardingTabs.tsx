"use client";

import { useTranslation } from "@/contexts/LanguageContext";

export type ClientWorkspaceTab = "overview" | "documents" | "board";

interface ClientOnboardingTabsProps {
  active: ClientWorkspaceTab;
  onChange: (tab: ClientWorkspaceTab) => void;
}

const TABS: ClientWorkspaceTab[] = ["overview", "documents", "board"];

export function ClientOnboardingTabs({ active, onChange }: ClientOnboardingTabsProps) {
  const { t } = useTranslation();

  const labels: Record<ClientWorkspaceTab, string> = {
    overview: t("clientDetail.tabOverview"),
    documents: t("clientDetail.tabDocuments"),
    board: t("clientDetail.tabBoard"),
  };

  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 shadow-sm">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
            active === tab
              ? "bg-white text-blue-800 shadow-sm ring-1 ring-blue-200"
              : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:ring-1 hover:ring-slate-300"
          }`}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
