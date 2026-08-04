import type { User } from "@/types/api";
import { canOwnSubSellers, isSalesAreaLeader } from "@/lib/roles";

export type StaffRoleCode =
  | "ADMIN"
  | "BRANCH_MANAGER"
  | "SALES_REP"
  | "SUB_SELLER"
  | "AREA_LEADER";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
  permission?: string | null;
  roles?: readonly StaffRoleCode[];
  /** Ítems de supervisión comercial: visibles para líder solo si área = VENTAS. */
  salesAreaOnly?: boolean;
  /** Solo vendedores (no subvendedores). */
  salesTeamPage?: boolean;
  /** Visible pero no navegable (p. ej. Mi equipo sin elegibilidad). */
  disabled?: boolean;
  disabledHintKey?: string;
}

export const internalNav: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.panel",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    permission: null,
  },
  {
    href: "/clientes",
    labelKey: "nav.clients",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    permission: "clients:read",
  },
  {
    href: "/prospectos",
    labelKey: "nav.prospects",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    permission: "prospects:read",
    roles: ["ADMIN", "BRANCH_MANAGER", "SALES_REP", "SUB_SELLER", "AREA_LEADER"],
    salesAreaOnly: true,
  },
  {
    href: "/calendario",
    labelKey: "nav.calendar",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    permission: null,
    roles: ["ADMIN", "BRANCH_MANAGER", "SALES_REP", "SUB_SELLER", "AREA_LEADER"],
    salesAreaOnly: true,
  },
  {
    href: "/contratos",
    labelKey: "nav.contracts",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    permission: null,
    roles: ["ADMIN", "BRANCH_MANAGER", "SALES_REP", "SUB_SELLER", "AREA_LEADER"],
    salesAreaOnly: true,
  },
  {
    href: "/pagos",
    labelKey: "nav.payments",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    permission: null,
    roles: ["ADMIN", "BRANCH_MANAGER", "SALES_REP", "SUB_SELLER", "AREA_LEADER"],
    salesAreaOnly: true,
  },
  {
    href: "/equipo",
    labelKey: "nav.subSellers",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    roles: ["SALES_REP", "AREA_LEADER"],
    salesTeamPage: true,
    salesAreaOnly: true,
  },
  {
    href: "/usuarios",
    labelKey: "nav.users",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    permission: "users:read",
  },
  {
    href: "/sedes",
    labelKey: "nav.sedes",
    icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    permission: "sedes:read",
    roles: ["ADMIN"],
  },
  {
    href: "/comercios",
    labelKey: "nav.merchants",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    permission: "merchants:read",
    roles: ["ADMIN"],
  },
  {
    href: "/fuentes",
    labelKey: "nav.sources",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    permission: "sources:read",
    roles: ["ADMIN"],
  },
  {
    href: "/influencers",
    labelKey: "nav.influencers",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    roles: ["AREA_LEADER"],
    salesAreaOnly: true,
  },
  {
    href: "/roles",
    labelKey: "nav.roles",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    permission: "roles:read",
    roles: ["ADMIN"],
  },
];

export const clientNav: NavItem[] = [
  {
    href: "/portal",
    labelKey: "nav.myPortal",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/portal/datos",
    labelKey: "nav.myData",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    href: "/portal/documentos",
    labelKey: "nav.documents",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/portal/tablero",
    labelKey: "nav.myBoard",
    icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
  },
];

export function getAccessibleNavItems(
  user: User | null,
  hasPermission: (permission: string) => boolean,
  options?: { boardUnlocked?: boolean },
): NavItem[] {
  if (!user) return [];

  if (user.role.code === "CLIENT") {
    const unlocked = Boolean(options?.boardUnlocked);
    return clientNav.filter((item) => item.href !== "/portal/tablero" || unlocked);
  }

  const salesLeader = isSalesAreaLeader(user);

  return internalNav.filter((item) => {
    if (item.roles && !item.roles.includes(user.role.code as StaffRoleCode)) {
      return false;
    }
    if (item.salesAreaOnly && user.role.code === "AREA_LEADER" && !salesLeader) {
      return false;
    }
    if (item.salesTeamPage && !canOwnSubSellers(user)) {
      return false;
    }
    return !item.permission || hasPermission(item.permission);
  }).map((item) => {
    if (item.href === "/usuarios" && salesLeader) {
      return { ...item, labelKey: "nav.salesReps" };
    }
    if (item.salesTeamPage && canOwnSubSellers(user) && !user.can_manage_sub_sellers) {
      return {
        ...item,
        disabled: true,
        disabledHintKey: "nav.subSellersLocked",
      };
    }
    return item;
  });
}

export function getAccessibleHrefs(
  user: User | null,
  hasPermission: (permission: string) => boolean,
  options?: { boardUnlocked?: boolean },
): string[] {
  return getAccessibleNavItems(user, hasPermission, options)
    .filter((item) => !item.disabled)
    .map((item) => item.href);
}
