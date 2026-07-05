"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Sidebar } from "@/components/layout/Sidebar";
import { AppDataPrefetcher } from "@/components/providers/AppDataPrefetcher";
import { LazyFloatingChatWidget } from "@/lib/lazyPanels";
import { NotificationsProvider } from "@/features/notifications/NotificationsContext";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { mobileOpen, closeMobile } = useShell();
  const { t } = useTranslation();
  const { user } = useAuth();
  const showStaffNotifications = user?.role.code !== "CLIENT";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NotificationsProvider enabled={showStaffNotifications}>
      <AppDataPrefetcher />
      <div className="app-shell-bg fixed inset-0 z-0 flex min-h-0 overflow-hidden">
        <button
          type="button"
          className={`fixed inset-0 z-40 bg-brown-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden ${
            mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-label={t("common.closeMenu")}
          aria-hidden={!mobileOpen}
          tabIndex={mobileOpen ? 0 : -1}
          onClick={closeMobile}
        />
        <Sidebar />
        <main className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
          {children}
        </main>
      </div>
      {mounted && showStaffNotifications
        ? createPortal(<LazyFloatingChatWidget />, document.body)
        : null}
    </NotificationsProvider>
  );
}
