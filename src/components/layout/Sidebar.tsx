"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppBrand } from "@/components/layout/AppBrand";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { resolveActiveHref } from "@/components/layout/sidebarNav";

const internalNav = [
  { href: "/dashboard", labelKey: "nav.panel", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", permission: null },
  { href: "/clientes", labelKey: "nav.clients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", permission: "clients:read" },
  { href: "/calendario", labelKey: "nav.calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", permission: null, roles: ["ADMIN", "SALES_REP"] as const },
  { href: "/contratos", labelKey: "nav.contracts", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", permission: null, roles: ["ADMIN", "SALES_REP"] as const },
  { href: "/usuarios", labelKey: "nav.users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", permission: "users:read" },
  { href: "/comercios", labelKey: "nav.merchants", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", permission: "merchants:create" },
  { href: "/areas", labelKey: "nav.areas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", permission: "areas:read" },
  { href: "/roles", labelKey: "nav.roles", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", permission: "roles:read" },
  { href: "/configuracion", labelKey: "nav.account", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", permission: null },
];

const clientNav = [
  { href: "/portal", labelKey: "nav.myPortal", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/portal/datos", labelKey: "nav.myData", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/portal/documentos", labelKey: "nav.documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/portal/tablero", labelKey: "nav.myBoard", icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" },
  { href: "/portal/cuenta", labelKey: "nav.account", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

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

  const items = isClient
    ? clientNav.map((i) => ({ ...i, permission: null }))
    : internalNav.filter((item) => {
        if ("roles" in item && item.roles && user && !item.roles.includes(user.role.code as "ADMIN" | "SALES_REP")) {
          return false;
        }
        return !item.permission || hasPermission(item.permission);
      });

  const activeHref = resolveActiveHref(
    pathname,
    items.map((item) => item.href),
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(17.5rem,85vw)] flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl max-lg:transition-transform max-lg:duration-300 max-lg:ease-[cubic-bezier(0.32,0.72,0,1)] lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:transition-[width] lg:duration-300 lg:ease-out ${
        mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      } ${collapsed ? "lg:w-[4.75rem]" : "lg:w-[17.5rem]"}`}
    >
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

      <div
        className={`flex border-b border-white/5 py-5 ${
          collapsed
            ? "items-center justify-between px-4 sm:px-6 lg:flex-col lg:justify-center lg:gap-2 lg:px-2"
            : "items-center justify-between px-4 sm:px-6"
        }`}
      >
        <div className={`flex min-w-0 items-center ${collapsed ? "gap-3 lg:justify-center lg:gap-0 lg:[&_.brand-label]:hidden" : "gap-3"}`}>
          <AppBrand showSubtitle dark />
        </div>
        <div className={`flex shrink-0 items-center gap-1 ${collapsed ? "lg:w-full lg:justify-center" : ""}`}>
          <button
            type="button"
            className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={collapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
            title={collapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
            onClick={toggleSidebar}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={t("common.closeMenu")}
            onClick={closeMobile}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className={`flex-1 space-y-1 overflow-y-auto py-5 ${collapsed ? "px-3 lg:px-2" : "px-3"}`}>
        <p
          className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 ${
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
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold">
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-xs text-slate-400">{user.role.name}</p>
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
                className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
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
