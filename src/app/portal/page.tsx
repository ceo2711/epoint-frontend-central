"use client";

import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { CompletionCornerCheck } from "@/features/portal/components/CompletionCornerCheck";
import { usePortalBoardUnlocked } from "@/features/portal/components/PortalBoardUnlockGate";
import { usePortalMe } from "@/features/portal/hooks/usePortalWorkspace";
import {
  documentGapLabels,
  isDocumentsComplete,
  isDocumentsIncomplete,
  isProfileComplete,
  isProfileIncomplete,
  profileGapLabels,
} from "@/features/portal/onboardingGaps";
import { useTranslation } from "@/contexts/LanguageContext";

export default function PortalHomePage() {
  const { token } = useAuth();
  const { t, locale } = useTranslation();
  const { data: client } = usePortalMe(token);
  const boardUnlocked = usePortalBoardUnlocked();
  const gaps = client?.onboarding_gaps;
  const profileMissing = profileGapLabels(gaps, t, locale);
  const documentMissing = documentGapLabels(gaps, t, locale);

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
          <StepCard
            step="1"
            title={t("portal.step1Title")}
            href="/portal/datos"
            desc={t("portal.step1Desc")}
            goLabel={t("common.go")}
            incomplete={isProfileIncomplete(gaps)}
            complete={isProfileComplete(gaps)}
            completeLabel={t("portal.stepComplete")}
            missingTitle={t("portal.missingTitle")}
            missingItems={profileMissing}
          />
          <StepCard
            step="2"
            title={t("portal.step2Title")}
            href="/portal/documentos"
            desc={t("portal.step2Desc")}
            goLabel={t("common.go")}
            incomplete={isDocumentsIncomplete(gaps)}
            complete={isDocumentsComplete(gaps)}
            completeLabel={t("portal.stepComplete")}
            missingTitle={t("portal.missingTitle")}
            missingItems={documentMissing}
          />
          <StepCard
            step="3"
            title={t("portal.step3Title")}
            href="/portal/tablero"
            desc={boardUnlocked ? t("portal.step3Desc") : t("portal.step3LockedDesc")}
            goLabel={boardUnlocked ? t("common.go") : t("portal.step3LockedCta")}
            locked={!boardUnlocked}
          />
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
  locked = false,
  incomplete = false,
  complete = false,
  completeLabel,
  missingTitle,
  missingItems = [],
}: {
  step: string;
  title: string;
  href: string;
  desc: string;
  goLabel: string;
  locked?: boolean;
  incomplete?: boolean;
  complete?: boolean;
  completeLabel?: string;
  missingTitle?: string;
  missingItems?: string[];
}) {
  const missingBlock =
    incomplete && missingItems.length > 0 ? (
      <div className="mt-3 rounded-lg bg-red-50 px-3 py-2">
        <p className="text-xs font-semibold text-red-500">{missingTitle}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-snug text-red-500">
          {missingItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null;

  if (locked) {
    return (
      <div
        className="step-card cursor-not-allowed opacity-70"
        aria-disabled="true"
        title={desc}
      >
        <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-400 text-sm font-bold text-white shadow-md">
          {step}
        </span>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-500">{desc}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-400">
          {goLabel}
        </span>
      </div>
    );
  }

  const stepClass = incomplete
    ? "step-card-incomplete"
    : complete
      ? "step-card-done"
      : "";
  const badgeClass = incomplete
    ? "bg-[#e85c5c] shadow-red-500/20"
    : complete
      ? "step-index"
      : "bg-blue-600 shadow-blue-600/25";
  const ctaClass = incomplete ? "text-red-500" : complete ? "step-cta" : "text-blue-600";

  return (
    <Link href={href} className={`step-card group ${stepClass}`}>
      {complete && completeLabel ? <CompletionCornerCheck label={completeLabel} /> : null}
      <span
        className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md transition group-hover:scale-105 ${badgeClass}`}
      >
        {step}
      </span>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500">{desc}</p>
      {missingBlock}
      <span
        className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 ${ctaClass}`}
      >
        {complete && completeLabel ? completeLabel : goLabel}
      </span>
    </Link>
  );
}
