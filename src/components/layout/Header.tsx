"use client";

import { ReactNode } from "react";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";

export function Header({
  title,
  subtitle,
  actions,
  bareTitle = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Si es true, no agrega el saludo con nombre. */
  bareTitle?: boolean;
}) {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { toggleMobile } = useShell();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
            aria-label={t("common.openMenu")}
            onClick={toggleMobile}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-snug tracking-tight text-slate-900 sm:text-xl lg:text-2xl">
              {user && !bareTitle ? (
                <>
                  {t("header.hello")}{" "}
                  <span className="text-blue-600">{user.first_name}</span>,{" "}
                  <span className="font-semibold text-slate-800">{title}</span>
                </>
              ) : (
                <span className="truncate">{title}</span>
              )}
            </h1>
            {subtitle && <p className="mt-0.5 truncate text-sm text-slate-600">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {actions}
          <NotificationBell />
          <LanguageSwitcher compact />
          {user && (
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="max-w-[8rem] truncate text-xs font-medium text-slate-600">{user.role.name}</span>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={logout} className="shrink-0">
            {t("common.logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
