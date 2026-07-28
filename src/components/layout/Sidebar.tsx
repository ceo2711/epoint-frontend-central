"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AppBrand } from "@/components/layout/AppBrand";
import { MerchantSwitcher } from "@/components/layout/MerchantSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { resolveActiveHref } from "@/components/layout/sidebarNav";
import { getAccessibleNavItems } from "@/lib/appNavigation";
import { prefetchRouteModule } from "@/lib/lazyPanels";
import { usePortalBoardUnlocked } from "@/features/portal/components/PortalBoardUnlockGate";

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
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const { t } = useTranslation();
  const { mobileOpen, closeMobile, sidebarCollapsed, toggleSidebar } = useShell();
  const collapsed = sidebarCollapsed;
  const boardUnlocked = usePortalBoardUnlocked();
  const items = getAccessibleNavItems(user, hasPermission, {
    boardUnlocked: user?.role.code === "CLIENT" ? boardUnlocked : true,
  });

  const activeHref = resolveActiveHref(
    pathname,
    items.map((item) => item.href),
  );

  function warmRoute(href: string) {
    router.prefetch(href);
    prefetchRouteModule(href);
  }

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
              onMouseEnter={() => warmRoute(item.href)}
              onFocus={() => warmRoute(item.href)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                collapsed ? "lg:justify-center lg:gap-0 lg:px-2" : ""
              } ${
                active
                  ? "bg-gradient-to-r from-cream-400 to-accent text-brown-950 shadow-[0_0_0_2px_#d4bc9a,0_4px_14px_rgba(0,0,0,0.25)]"
                  : "text-cream-700 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon d={item.icon} />
              <span className={`flex-1 ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
