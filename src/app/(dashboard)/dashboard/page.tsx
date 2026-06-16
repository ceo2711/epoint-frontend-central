"use client";

import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { useTranslation } from "@/contexts/LanguageContext";

export default function DashboardPage() {
  const { user, token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const canViewClients = hasPermission("clients:read");
  const { stats, loading, error } = useDashboardStats(token, canViewClients);

  return (
    <>
      <Header
        title={t("dashboard.headerContext")}
        subtitle={t("dashboard.subtitle")}
      />
      <PageContent className="space-y-6">
        {canViewClients ? (
          <>
            {loading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner label={t("dashboard.loadingStats")} />
              </div>
            )}
            {error && !loading && (
              <div className="alert alert-error">{t("dashboard.statsError")}</div>
            )}
            {stats && !loading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title={t("dashboard.pendingReview")}
                  value={stats.pending_review}
                  accent="amber"
                  href="/clientes"
                />
                <StatCard
                  title={t("dashboard.approvedClients")}
                  value={stats.approved_in_onboarding}
                  accent="green"
                  href="/clientes"
                />
                <StatCard
                  title={t("dashboard.rejectedClients")}
                  value={stats.rejected}
                  accent="red"
                  href="/clientes"
                />
                <StatCard
                  title={t("dashboard.onboardingInProgress")}
                  value={stats.onboarding_in_progress}
                  accent="blue"
                  href="/clientes"
                />
                <StatCard
                  title={t("dashboard.completedClients")}
                  value={stats.completed}
                  accent="indigo"
                  href="/clientes"
                />
                <StatCard
                  title={t("dashboard.totalClients")}
                  value={stats.total}
                  accent="slate"
                  href="/clientes"
                />
              </div>
            )}
          </>
        ) : (
          <div className="card-flat p-6">
            <h2 className="text-lg font-semibold text-slate-900">{t("dashboard.summaryTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("dashboard.summaryBody")}</p>
          </div>
        )}
      </PageContent>
    </>
  );
}

function StatCard({
  title,
  value,
  accent = "blue",
  href,
}: {
  title: string;
  value: number;
  accent?: "blue" | "indigo" | "green" | "slate" | "amber" | "red";
  href?: string;
}) {
  const accentColors = {
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-emerald-500 to-emerald-600",
    slate: "from-slate-400 to-slate-500",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
  };

  const content = (
    <div className="stat-card transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
        </div>
        <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${accentColors[accent]}`} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
