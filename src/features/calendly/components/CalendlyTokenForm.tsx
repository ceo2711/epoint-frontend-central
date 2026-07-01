"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";

interface CalendlyTokenFormProps {
  onSubmit: (accessToken: string, schedulingUrl?: string) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  defaultSchedulingUrl?: string;
  idPrefix?: string;
}

export function CalendlyTokenForm({
  onSubmit,
  submitLabel,
  submittingLabel,
  defaultSchedulingUrl = "",
  idPrefix = "calendly",
}: CalendlyTokenFormProps) {
  const { t } = useTranslation();
  const [accessToken, setAccessToken] = useState("");
  const [schedulingUrl, setSchedulingUrl] = useState(defaultSchedulingUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(accessToken.trim(), schedulingUrl.trim() || undefined);
      setAccessToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("calendly.connectError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert alert-error">{error}</div>}

      <Input
        id={`${idPrefix}Token`}
        label={t("calendly.tokenLabel")}
        type="password"
        required
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        placeholder={t("calendly.tokenPlaceholder")}
      />
      <Input
        id={`${idPrefix}SchedulingUrl`}
        label={t("calendly.schedulingUrlLabel")}
        type="url"
        value={schedulingUrl}
        onChange={(e) => setSchedulingUrl(e.target.value)}
        placeholder="https://calendly.com/tu-usuario"
      />
      <p className="text-xs text-slate-500">{t("calendly.tokenHelp")}</p>
      <Button type="submit" disabled={submitting || !accessToken.trim()}>
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
