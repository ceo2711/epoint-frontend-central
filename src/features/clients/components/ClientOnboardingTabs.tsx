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
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            active === tab
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
