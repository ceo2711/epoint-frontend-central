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
  excludeEventId?: number | null;
  reschedule?: boolean;
  /** Solo reuniones sin otro prospecto vinculado. */
  onlyUnlinked?: boolean;
  /** Flujo al marcar contactado: títulos y CTA distintos. */
  markContactedMode?: boolean;
  onClose: () => void;
  /** Si no hay reunión (o se reunieron fuera del calendario), continuar con comentario. */
  onSkipToNote?: () => void;
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
  excludeEventId,
  reschedule = false,
  onlyUnlinked = false,
  markContactedMode = false,
  onClose,
  onSkipToNote,
  onLink,
}: ProspectCalendlyLinkModalProps) {
  const { t, locale } = useTranslation();
  const { events, loading, connection, error } = useCalendly(token, salesRepUserId, {
    loadSalesReps: false,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeEvents = events.filter((event) => {
    if (event.status === "canceled") return false;
    if (event.id === excludeEventId) return false;
    if (onlyUnlinked && event.prospect_id != null) return false;
    return true;
  });

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

  const title = markContactedMode
    ? t("prospects.markContactedPickMeetingTitle")
    : reschedule
      ? t("prospects.scheduleAnotherMeetingTitle")
      : t("prospects.linkCalendlyTitle");

  const submitLabel = markContactedMode
    ? t("prospects.markContactedPickMeetingAction")
    : reschedule
      ? t("prospects.scheduleAnotherMeetingAction")
      : t("prospects.linkCalendlyAction");

  return (
    <Modal title={title} onClose={onClose} size="lg">
      {markContactedMode ? (
        <p className="mb-4 text-sm text-slate-500">{t("prospects.markContactedPickMeetingHint")}</p>
      ) : reschedule ? (
        <p className="mb-4 text-sm text-slate-500">{t("prospects.scheduleAnotherMeetingHint")}</p>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner label={t("common.loading")} />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !connection?.connected ? (
        <p className="text-sm text-slate-500">{t("prospects.linkCalendlyNotConnected")}</p>
      ) : activeEvents.length === 0 ? (
        <p className="text-sm text-slate-500">
          {onlyUnlinked || markContactedMode
            ? t("prospects.markContactedNoFreeMeetings")
            : t("prospects.linkCalendlyEmpty")}
        </p>
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
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        {markContactedMode && onSkipToNote ? (
          <Button type="button" variant="secondary" onClick={onSkipToNote} disabled={submitting}>
            {t("prospects.markContactedOtherChannel")}
          </Button>
        ) : null}
        <Button type="button" onClick={() => void handleSubmit()} disabled={!selectedId || submitting}>
          {submitting ? t("common.loading") : submitLabel}
        </Button>
      </div>
    </Modal>
  );
}
