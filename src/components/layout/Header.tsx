"use client";

import { ReactNode } from "react";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { AppBrand } from "@/components/layout/AppBrand";
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
  bareTitle?: boolean;
}) {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { toggleMobile } = useShell();
  const showNotifications = user?.role.code !== "CLIENT";

  return (
    <header className="sticky top-0 z-30 w-full max-w-full shrink-0 border-b border-cream-600 bg-cream-100/95 shadow-sm backdrop-blur-md lg:px-8 lg:py-4">
      {/* Mobile / tablet: menú · marca · notificaciones */}
      <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 px-3 py-2.5 lg:hidden">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label={t("common.openMenu")}
          onClick={toggleMobile}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex min-w-0 justify-center">
          <AppBrand />
        </div>

        <div className="flex justify-end">
          {showNotifications ? <NotificationBell /> : null}
        </div>
      </div>

      {/* Desktop: título completo + acciones */}
      <div className="hidden px-6 lg:flex lg:items-start lg:justify-between lg:gap-4 lg:px-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-snug tracking-tight text-slate-900">
            {user && !bareTitle ? (
              <>
                {t("header.hello")}{" "}
                <span className="text-brand">{user.first_name}</span>,{" "}
                <span className="font-semibold text-slate-800">{title}</span>
              </>
            ) : (
              title
            )}
          </h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-slate-600">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          {actions}
          {showNotifications ? <NotificationBell /> : null}
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
