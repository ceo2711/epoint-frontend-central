"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

interface AppBrandProps {
  showSubtitle?: boolean;
  /** Para sidebar oscuro */
  dark?: boolean;
}

export function AppBrand({ showSubtitle = false, dark = false }: AppBrandProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isClient = user?.role.code === "CLIENT";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
        <span className="text-sm font-bold text-white">eP</span>
      </div>
      <div className="brand-label min-w-0">
        <p className={`truncate text-sm font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
          ePoint Central
        </p>
        {showSubtitle && (
          <p className={`truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {isClient ? t("nav.clientPortal") : t("nav.management")}
          </p>
        )}
      </div>
    </div>
  );
}
