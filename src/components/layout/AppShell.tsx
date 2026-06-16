"use client";

import { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { mobileOpen, closeMobile } = useShell();
  const { t } = useTranslation();

  return (
    <div className="flex h-dvh min-h-0 app-shell-bg">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          aria-label={t("common.closeMenu")}
          onClick={closeMobile}
        />
      )}
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
