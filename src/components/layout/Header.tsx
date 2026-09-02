"use client";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { AppBrand } from "@/components/layout/AppBrand";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/features/auth/AuthContext";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";

export function Header({
  title,
  bareTitle = false,
}: {
  title: string;
  subtitle?: string;
  bareTitle?: boolean;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toggleMobile } = useShell();
  const showNotifications = Boolean(user);

  const displayName =
    user?.first_name?.trim() ||
    user?.email?.split("@")[0] ||
    "";

  return (
    <header className="sticky top-0 z-50 w-full max-w-full shrink-0 border-b border-cream-600 bg-cream-100/95 shadow-sm backdrop-blur-md lg:px-8 lg:py-4">
      {/* Mobile / tablet: menú · marca · notificaciones + usuario */}
      <div className="flex items-center gap-2 px-3 py-2.5 lg:hidden">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label={t("common.openMenu")}
          onClick={toggleMobile}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 justify-center">
          <AppBrand />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {showNotifications ? <NotificationBell /> : null}
          <UserMenu />
        </div>
      </div>

      {/* Desktop: saludo contextual + controles */}
      <div className="hidden px-6 lg:flex lg:items-center lg:justify-between lg:gap-4 lg:px-0">
        <div className="min-w-0 flex-1">
          {user || bareTitle ? (
            <p className="min-w-0 truncate text-xl font-medium tracking-tight text-slate-600">
              {!bareTitle && displayName ? (
                <>
                  {t("header.hello")},{" "}
                  <span className="font-bold text-brand">{displayName}</span>
                  {title ? (
                    <>
                      , <span className="text-slate-500">{title}</span>
                    </>
                  ) : null}
                </>
              ) : (
                title
              )}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3">
          {showNotifications ? <NotificationBell /> : null}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
