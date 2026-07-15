"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlyEvent } from "@/features/calendly/types";

interface CalendlyEventModalProps {
  event: CalendlyEvent;
  canManage: boolean;
  canSendContract?: boolean;
  canLinkProspect?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSendContract?: () => void;
  onLinkProspect?: () => void;
}

function formatEventRange(start: string, end: string, locale: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)} – ${timeFormatter.format(endDate)}`;
}

export function CalendlyEventModal({
  event,
  canManage,
  canSendContract = false,
  canLinkProspect = false,
  onClose,
  onEdit,
  onDelete,
  onSendContract,
  onLinkProspect,
}: CalendlyEventModalProps) {
  const { t, locale } = useTranslation();

  return (
    <Modal title={event.name} onClose={onClose} size="lg">
      <div className="space-y-3 text-sm text-slate-700">
        {event.invitee_name && (
          <p>
            <span className="font-medium text-slate-900">{t("calendly.invitee")}:</span>{" "}
            {event.invitee_name}
            {event.invitee_email ? ` (${event.invitee_email})` : ""}
          </p>
        )}
        {event.invitee_comment && (
          <div className="whitespace-pre-wrap">
            <span className="font-medium text-slate-900">{t("calendly.inviteeComment")}:</span>
            <div className="mt-1 space-y-1 text-slate-700">
              {event.invitee_comment.split("\n").map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        )}
        {event.event_type_name && (
          <p>
            <span className="font-medium text-slate-900">{t("calendly.eventType")}:</span>{" "}
            {event.event_type_name}
          </p>
        )}
        <p>
          <span className="font-medium text-slate-900">{t("calendly.scheduledAt")}:</span>{" "}
          {formatEventRange(event.start_time, event.end_time, locale)}
        </p>

        {canLinkProspect ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("prospects.title")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {event.prospect_id ? (
                <Link href={`/prospectos/${event.prospect_id}`} className="btn btn-secondary btn-sm">
                  {t("prospects.viewLinkedProspect")}
                </Link>
              ) : onLinkProspect ? (
                <Button type="button" variant="secondary" size="sm" onClick={onLinkProspect}>
                  {t("prospects.linkToProspect")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {event.meeting_url || canSendContract ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {event.meeting_url ? (
              <Button
                type="button"
                onClick={() => window.open(event.meeting_url!, "_blank", "noopener,noreferrer")}
              >
                {t("calendly.joinMeeting")}
              </Button>
            ) : null}
            {canSendContract && event.invitee_email ? (
              <Button type="button" variant="secondary" onClick={onSendContract}>
                {t("docusign.sendAction")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {canManage && (
        <div className="modal-actions !mt-6">
          <Button type="button" variant="danger" onClick={onDelete}>
            {t("calendly.deleteEvent")}
          </Button>
          <Button type="button" variant="secondary" onClick={onEdit}>
            {t("calendly.editEvent")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
