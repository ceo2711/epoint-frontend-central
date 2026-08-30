"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlyEvent } from "@/features/calendly/types";
import { formatDateTimeRange } from "@/lib/format-datetime";

interface CalendlyEventModalProps {
  event: CalendlyEvent;
  canManage: boolean;
  canLinkProspect?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLinkProspect?: () => void;
}

function formatEventRange(start: string, end: string) {
  return formatDateTimeRange(start, end);
}

export function CalendlyEventModal({
  event,
  canManage,
  canLinkProspect = false,
  onClose,
  onEdit,
  onDelete,
  onLinkProspect,
}: CalendlyEventModalProps) {
  const { t } = useTranslation();

  const linkedClientId = event.linked_prospect?.converted_client_id ?? null;
  const linkedProspectId = event.linked_prospect?.id ?? event.prospect_id ?? null;
  const hasLinkedPerson = Boolean(linkedProspectId || event.linked_prospect);
  const linkedHref = linkedClientId
    ? `/clientes/${linkedClientId}`
    : linkedProspectId
      ? `/prospectos/${linkedProspectId}`
      : null;
  const linkedLabel = linkedClientId ? t("common.client") : t("nav.prospects");
  const linkedName = event.linked_prospect?.full_name ?? event.invitee_name ?? t("common.dash");
  const linkedEmail = event.linked_prospect?.email ?? event.invitee_email ?? t("common.dash");

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
          {formatEventRange(event.start_time, event.end_time)}
        </p>

        {canLinkProspect ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
            {hasLinkedPerson && linkedHref ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {linkedLabel}
                </p>
                <Link
                  href={linkedHref}
                  className="mt-2 block rounded-lg -mx-1 px-1 py-1 outline-none transition hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <p className="font-medium text-slate-900">{linkedName}</p>
                  <p className="text-slate-600">{linkedEmail}</p>
                  <p className="mt-1 text-xs font-medium text-brand">{t("common.view")} →</p>
                </Link>
              </>
            ) : onLinkProspect ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("nav.prospects")}
                </p>
                <div className="mt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={onLinkProspect}>
                    {t("prospects.linkToProspect")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("nav.prospects")}
                </p>
                <p className="mt-2 text-sm text-slate-500">{t("calendly.noLinkedClient")}</p>
              </>
            )}
          </div>
        ) : null}

        {event.meeting_url ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              onClick={() => window.open(event.meeting_url!, "_blank", "noopener,noreferrer")}
            >
              {t("calendly.joinMeeting")}
            </Button>
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
