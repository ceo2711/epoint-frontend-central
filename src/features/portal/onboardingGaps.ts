import { translateStatus, type Locale } from "@/i18n";
import type { OnboardingGaps } from "@/types/api";

export function isProfileIncomplete(gaps: OnboardingGaps | null | undefined): boolean {
  return Boolean(gaps?.profile_fields?.length);
}

export function isDocumentsIncomplete(gaps: OnboardingGaps | null | undefined): boolean {
  if (!gaps) return false;
  return Boolean(
    gaps.missing_documents?.length ||
      gaps.rejected_documents?.length ||
      gaps.expiring_documents?.length,
  );
}

function baseGapLabel(
  key: string,
  t: (key: string) => string,
  locale: Locale,
): string {
  const profileKey = `portal.gaps.profile.${key}`;
  const profileLabel = t(profileKey);
  if (profileLabel !== profileKey) return profileLabel;

  const docGroupKey = `portal.gaps.docs.${key}`;
  const groupLabel = t(docGroupKey);
  if (groupLabel !== docGroupKey) return groupLabel;

  return translateStatus(locale, "documentTypes", key);
}

export function profileGapLabels(
  gaps: OnboardingGaps | null | undefined,
  t: (key: string) => string,
  locale: Locale,
): string[] {
  return (gaps?.profile_fields ?? []).map((key) => baseGapLabel(key, t, locale));
}

export function documentGapLabels(
  gaps: OnboardingGaps | null | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
  locale: Locale,
): string[] {
  if (!gaps) return [];
  const labels: string[] = [];
  for (const key of gaps.missing_documents ?? []) {
    labels.push(baseGapLabel(key, t, locale));
  }
  for (const key of gaps.rejected_documents ?? []) {
    labels.push(t("portal.gaps.rejected", { item: baseGapLabel(key, t, locale) }));
  }
  for (const key of gaps.expiring_documents ?? []) {
    labels.push(t("portal.gaps.expiring", { item: baseGapLabel(key, t, locale) }));
  }
  return labels;
}
