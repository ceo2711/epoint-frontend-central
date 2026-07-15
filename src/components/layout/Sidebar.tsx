"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppBrand } from "@/components/layout/AppBrand";
import { MerchantSwitcher } from "@/components/layout/MerchantSwitcher";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { resolveActiveHref } from "@/components/layout/sidebarNav";
import { getAccessibleNavItems } from "@/lib/appNavigation";

function NavIcon({ d }: { d: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission, logout } = useAuth();
  const { t } = useTranslation();
  const { mobileOpen, closeMobile, sidebarCollapsed, toggleSidebar } = useShell();
  const isClient = user?.role.code === "CLIENT";
  const collapsed = sidebarCollapsed;
  const items = getAccessibleNavItems(user, hasPermission);

  const activeHref = resolveActiveHref(
    pathname,
    items.map((item) => item.href),
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(17.5rem,85vw)] flex-col bg-gradient-to-b from-brown-950 via-brown-900 to-brown-950 text-white shadow-xl max-lg:transition-transform max-lg:duration-300 max-lg:ease-[cubic-bezier(0.32,0.72,0,1)] lg:static lg:z-auto lg:h-full lg:min-h-0 lg:shrink-0 lg:translate-x-0 lg:transition-[width] lg:duration-300 lg:ease-out ${
        mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      } ${collapsed ? "lg:w-[4.75rem]" : "lg:w-[17.5rem]"}`}
    >
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent/30 to-transparent" />

      <div
        className={`flex border-b border-white/5 py-5 ${
          collapsed
            ? "items-center justify-between px-4 sm:px-6 lg:flex-col lg:justify-center lg:gap-2 lg:px-2"
            : "items-center justify-between px-4 sm:px-6"
        }`}
      >
        <div className={`flex min-w-0 items-center ${collapsed ? "gap-3 lg:justify-center lg:gap-0 lg:[&_.brand-label]:hidden" : "gap-3"}`}>
          <AppBrand dark logoPriority />
        </div>
        <div className={`flex shrink-0 items-center gap-1 ${collapsed ? "lg:w-full lg:justify-center" : ""}`}>
          <button
            type="button"
            className="hidden rounded-lg p-2 text-cream-700 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={collapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
            title={collapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
            onClick={toggleSidebar}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-cream-700 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={t("common.closeMenu")}
            onClick={closeMobile}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <MerchantSwitcher collapsed={collapsed} />

      <nav className={`flex-1 space-y-1 overflow-y-auto py-5 ${collapsed ? "px-3 lg:px-2" : "px-3"}`}>
        <p
          className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-cream-700 ${
            collapsed ? "lg:sr-only" : ""
          }`}
        >
          {t("nav.navigation")}
        </p>
        {items.map((item) => {
          const active = activeHref === item.href;
          const label = t(item.labelKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? label : undefined}
              onClick={closeMobile}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                collapsed ? "lg:justify-center lg:gap-0 lg:px-2" : ""
              } ${
                active
                  ? "bg-gradient-to-r from-cream-400 to-accent text-brown-950 shadow-md shadow-black/20"
                  : "text-cream-700 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon d={item.icon} />
              <span className={`flex-1 ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-white/5 ${collapsed ? "p-4 lg:p-2" : "p-4"}`}>
        {user && (
          <>
            {collapsed && (
              <Link
                href={isClient ? "/portal/cuenta" : "/configuracion"}
                className="hidden justify-center pb-1 lg:flex"
                title={`${user.first_name} ${user.last_name}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-light to-accent text-xs font-bold text-brown-950">
                  {user.first_name[0]}
                  {user.last_name[0]}
                </div>
              </Link>
            )}
            <Link
              href={isClient ? "/portal/cuenta" : "/configuracion"}
              title={collapsed ? `${user.first_name} ${user.last_name}` : undefined}
              className={`flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm transition hover:bg-white/10 ${collapsed ? "lg:hidden" : ""}`}
              onClick={closeMobile}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-light to-accent text-xs font-bold text-brown-950">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-xs text-cream-700">{user.role.name}</p>
              </div>
            </Link>

            <div className="mt-3 space-y-3 border-t border-white/10 pt-3 lg:hidden">
              <LanguageSwitcher
                compact
                className="w-full justify-center border-white/15 bg-white/5"
              />
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  logout();
                }}
                className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-cream-700 transition hover:bg-white/10 hover:text-white"
              >
                {t("common.logout")}
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
