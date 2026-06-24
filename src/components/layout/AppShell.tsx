"use client";

import { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { FloatingChatWidget } from "@/features/chat/components/FloatingChatWidget";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { mobileOpen, closeMobile } = useShell();
  const { t } = useTranslation();

  return (
    <div className="app-shell-bg flex h-dvh min-h-0 w-full max-w-full overflow-x-hidden">
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label={t("common.closeMenu")}
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={closeMobile}
      />
      <Sidebar />
      <main className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {children}
      </main>
      <FloatingChatWidget />
    </div>
  );
}
