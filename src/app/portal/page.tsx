"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import type { Client } from "@/types/api";

export default function PortalHomePage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<Client>("/portal/me", token).then(setClient).catch(() => {});
  }, [token]);

  return (
    <>
      <Header title={t("portal.headerContext")} subtitle={t("portal.subtitle")} />
      <PageContent className="space-y-6">
        <Card className="relative overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/60 blur-2xl" />
          <div className="relative">
            <h2 className="text-xl font-bold text-slate-900">{t("portal.welcomeTitle")}</h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">{t("portal.welcomeBody")}</p>
            {client && (
              <div className="mt-5">
                <StatusBadge status={client.status} />
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <StepCard step="1" title={t("portal.step1Title")} href="/portal/datos" desc={t("portal.step1Desc")} goLabel={t("common.go")} />
          <StepCard step="2" title={t("portal.step2Title")} href="/portal/documentos" desc={t("portal.step2Desc")} goLabel={t("common.go")} />
          <StepCard step="3" title={t("portal.step3Title")} href="/portal/tablero" desc={t("portal.step3Desc")} goLabel={t("common.go")} />
        </div>
      </PageContent>
    </>
  );
}

function StepCard({
  step,
  title,
  href,
  desc,
  goLabel,
}: {
  step: string;
  title: string;
  href: string;
  desc: string;
  goLabel: string;
}) {
  return (
    <Link href={href} className="step-card group">
      <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition group-hover:scale-105">
        {step}
      </span>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        {goLabel}
      </span>
    </Link>
  );
}
