"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlyEventType } from "@/features/calendly/types";
import { copyToClipboard } from "@/lib/clipboard";

interface CalendlyShareLinkProps {
  eventTypes: CalendlyEventType[];
  profileUrl?: string | null;
  loading?: boolean;
}

export function CalendlyShareLink({ eventTypes, profileUrl, loading = false }: CalendlyShareLinkProps) {
  const { t } = useTranslation();
  const [copiedUri, setCopiedUri] = useState<string | null>(null);

  const shareableTypes = eventTypes.filter((type) => type.scheduling_url);

  async function handleCopy(url: string, uri: string) {
    const ok = await copyToClipboard(url);
    if (!ok) return;
    setCopiedUri(uri);
    window.setTimeout(() => setCopiedUri(null), 2000);
  }

  return (
    <div className="card-flat space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("calendly.shareTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("calendly.shareSubtitle")}</p>
      </div>

      {loading ? (
        <LoadingSpinner label={t("calendly.loadingEventTypes")} />
      ) : shareableTypes.length > 0 ? (
        <div className="space-y-3">
          {shareableTypes.map((eventType) => (
            <div
              key={eventType.uri}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{eventType.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t("calendly.eventTypeDuration", { minutes: String(eventType.duration) })}
                  </p>
                  <code className="mt-2 block break-all text-sm text-slate-700">
                    {eventType.scheduling_url}
                  </code>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleCopy(eventType.scheduling_url!, eventType.uri)}
                  >
                    {copiedUri === eventType.uri ? t("calendly.copied") : t("calendly.copyLink")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(eventType.scheduling_url!, "_blank")}
                  >
                    {t("calendly.openLink")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : profileUrl ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 break-all rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {profileUrl}
          </code>
          <Button type="button" variant="secondary" onClick={() => void handleCopy(profileUrl, "profile")}>
            {copiedUri === "profile" ? t("calendly.copied") : t("calendly.copyLink")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{t("calendly.noShareLinks")}</p>
      )}

      {profileUrl && shareableTypes.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("calendly.profileLinkLabel")}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 break-all rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {profileUrl}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleCopy(profileUrl, "profile")}
            >
              {copiedUri === "profile" ? t("calendly.copied") : t("calendly.copyLink")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
