"use client";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <>
      <Header
        title={t("dashboard.greeting", { name: user?.first_name ?? "" })}
        subtitle={t("dashboard.subtitle")}
      />
      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t("dashboard.yourRole")} value={user?.role.name ?? t("common.dash")} accent="blue" />
          <StatCard title={t("dashboard.yourArea")} value={user?.area?.name ?? t("common.noArea")} accent="indigo" />
          <StatCard
            title={t("dashboard.yourStatus")}
            value={user?.is_active ? t("common.active") : t("common.inactive")}
            accent={user?.is_active ? "green" : "slate"}
          />
        </div>
      </PageContent>
    </>
  );
}

function StatCard({
  title,
  value,
  accent = "blue",
}: {
  title: string;
  value: string;
  accent?: "blue" | "indigo" | "green" | "slate";
}) {
  const accentColors = {
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-emerald-500 to-emerald-600",
    slate: "from-slate-400 to-slate-500",
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${accentColors[accent]}`} />
      </div>
    </div>
  );
}
