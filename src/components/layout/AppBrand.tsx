"use client";

import { AppLogo } from "@/components/layout/AppLogo";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

interface AppBrandProps {
  showSubtitle?: boolean;
  /** Para sidebar oscuro */
  dark?: boolean;
  /** Prioridad de carga (login, sidebar) */
  logoPriority?: boolean;
}

export function AppBrand({ showSubtitle = false, dark = false, logoPriority }: AppBrandProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isClient = user?.role.code === "CLIENT";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <AppLogo size="sm" priority={logoPriority} />
      <div className="brand-label min-w-0">
        <p className={`truncate text-sm font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
          Epoint Corporation
        </p>
        {showSubtitle && isClient && (
          <p className={`truncate text-xs ${dark ? "text-cream-700" : "text-slate-500"}`}>
            {t("nav.clientPortal")}
          </p>
        )}
      </div>
    </div>
  );
}
