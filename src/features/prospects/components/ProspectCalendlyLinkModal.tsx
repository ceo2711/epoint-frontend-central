"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { useCalendly } from "@/features/calendly/hooks/useCalendly";
import type { CalendlyEvent } from "@/features/calendly/types";

interface ProspectCalendlyLinkModalProps {
  token: string | null;
  salesRepUserId: number;
  onClose: () => void;
  onLink: (calendlyEventId: number) => Promise<void>;
}

function formatEventTime(value: string, locale: string) {
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ProspectCalendlyLinkModal({
  token,
  salesRepUserId,
  onClose,
  onLink,
}: ProspectCalendlyLinkModalProps) {
  const { t, locale } = useTranslation();
  const { events, loading } = useCalendly(token, salesRepUserId);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeEvents = events.filter((event) => event.status !== "canceled");

  async function handleSubmit() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await onLink(selectedId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t("prospects.linkCalendlyTitle")} onClose={onClose} size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner label={t("common.loading")} />
        </div>
      ) : activeEvents.length === 0 ? (
        <p className="text-sm text-slate-500">{t("prospects.linkCalendlyEmpty")}</p>
      ) : (
        <div className="max-h-[360px] space-y-2 overflow-y-auto">
          {activeEvents.map((event: CalendlyEvent) => (
            <label
              key={event.id}
              className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm transition-colors ${
                selectedId === event.id
                  ? "border-brand bg-brand/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="calendly-event"
                className="mt-1"
                checked={selectedId === event.id}
                onChange={() => setSelectedId(event.id)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{event.name}</p>
                <p className="text-slate-600">{formatEventTime(event.start_time, locale)}</p>
                {event.invitee_name || event.invitee_email ? (
                  <p className="text-slate-500">
                    {[event.invitee_name, event.invitee_email].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={() => void handleSubmit()} disabled={!selectedId || submitting}>
          {submitting ? t("common.loading") : t("prospects.linkCalendlyAction")}
        </Button>
      </div>
    </Modal>
  );
}
