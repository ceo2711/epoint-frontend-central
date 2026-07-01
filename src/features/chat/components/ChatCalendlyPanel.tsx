"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CalendlyCustomQuestionFields } from "@/features/calendly/components/CalendlyCustomQuestionFields";
import type { CalendlyCustomQuestion } from "@/features/calendly/types";
import type { ChatCalendlyOptions } from "@/features/chat/types";
import {
  extractEventTime,
  groupCalendlyEventsByDay,
  type ChatCalendlyEventRow,
} from "@/features/chat/utils/groupCalendlyEvents";
import { CALENDLY_WRITE_ENABLED } from "@/features/calendly/config";
import { translate } from "@/i18n";

interface ChatCalendlyPanelProps {
  options: ChatCalendlyOptions;
  chatLocale: "es" | "en";
  disabled?: boolean;
  onSelectEventType: (uri: string, name: string) => void;
  onSelectDate: (dateValue: string, draft: Record<string, unknown>) => void;
  onSelectSlot: (startTime: string, label: string, draft: Record<string, unknown>) => void;
  onSubmitCreate: (payload: Record<string, unknown>) => void;
  onSubmitUpdate: (payload: Record<string, unknown>) => void;
  onCancelEvent: (eventId: number) => void;
  onStartEdit: (eventId: number) => void;
  onStartCreate: () => void;
}

function toDateInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function ChatCalendlyPanel({
  options,
  chatLocale,
  disabled = false,
  onSelectEventType,
  onSelectDate,
  onSelectSlot,
  onSubmitCreate,
  onSubmitUpdate,
  onCancelEvent,
  onStartEdit,
  onStartCreate,
}: ChatCalendlyPanelProps) {
  const t = (key: string, params?: Record<string, string | number>) => translate(chatLocale, key, params);
  const draft = options.draft_summary ?? {};
  const [dateValue, setDateValue] = useState(String(draft.date ?? toDateInputValue()));
  const [inviteeName, setInviteeName] = useState(String(draft.invitee_name ?? ""));
  const [inviteeEmail, setInviteeEmail] = useState(String(draft.invitee_email ?? ""));
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  const customQuestions = useMemo(
    () => (options.custom_questions ?? []) as unknown as CalendlyCustomQuestion[],
    [options.custom_questions],
  );

  const eventsByDay = useMemo(
    () => groupCalendlyEventsByDay((options.events ?? []) as ChatCalendlyEventRow[]),
    [options.events],
  );

  const isEventsList = options.step === "events_list";

  useEffect(() => {
    setDateValue(String(draft.date ?? toDateInputValue()));
    setInviteeName(String(draft.invitee_name ?? ""));
    setInviteeEmail(String(draft.invitee_email ?? ""));
    setQuestionAnswers({});
  }, [options.step, draft.date, draft.invitee_name, draft.invitee_email, draft.event_type_uri]);

  function buildQuestionsPayload() {
    return customQuestions.map((question) => {
      let answer = questionAnswers[question.uuid]?.trim() ?? "";
      if (question.type === "single_select" && answer === "__other__") {
        answer = questionAnswers[`${question.uuid}__other`]?.trim() ?? "";
      }
      return {
        question_uuid: question.uuid,
        question_name: question.name,
        answer,
      };
    });
  }

  function handleCreateSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmitCreate({
      event_type_uri: draft.event_type_uri,
      event_type_name: draft.event_type_name,
      date: draft.date,
      start_time: draft.start_time,
      slot_label: draft.slot_label,
      invitee_name: inviteeName.trim(),
      invitee_email: inviteeEmail.trim(),
      custom_questions: customQuestions,
      questions_and_answers: buildQuestionsPayload(),
    });
  }

  function handleUpdateSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmitUpdate({
      event_id: draft.event_id,
      event_type_uri: draft.event_type_uri,
      event_type_name: draft.event_type_name,
      date: draft.date,
      start_time: draft.start_time,
      slot_label: draft.slot_label,
      invitee_name: inviteeName.trim(),
      invitee_email: inviteeEmail.trim(),
      questions_and_answers: buildQuestionsPayload(),
    });
  }

  return (
    <div
      className={
        isEventsList
          ? "space-y-2"
          : "space-y-3 rounded-xl border border-violet-200 bg-violet-50/90 p-3 shadow-sm"
      }
    >
      {!isEventsList && (
        <p className="text-xs font-semibold text-violet-900">{t("chat.calendlyPanelTitle")}</p>
      )}

      {isEventsList && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <p className="text-xs font-semibold text-violet-900">{t("chat.calendlyPanelTitle")}</p>
            {CALENDLY_WRITE_ENABLED && (
              <Button type="button" size="sm" disabled={disabled} onClick={onStartCreate}>
                {t("chat.calendlyCreateAction")}
              </Button>
            )}
          </div>

          <div className="max-h-52 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {eventsByDay.length === 0 && (
              <p className="text-xs text-slate-500">{t("chat.calendlyNoEvents")}</p>
            )}
            {eventsByDay.map((group) => (
              <div key={group.dayKey} className="space-y-1.5">
                <p className="sticky top-0 z-[1] bg-white/95 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 backdrop-blur-sm">
                  {group.dayKey}
                </p>
                {group.events.map((event) => (
                  <div
                    key={String(event.id)}
                    className="rounded-lg border border-violet-100 bg-violet-50/40 px-2.5 py-2 text-[11px] text-slate-700"
                  >
                    <p className="font-semibold text-slate-900">
                      <span className="text-violet-700">#{String(event.id)}</span> {String(event.name ?? "")}
                      {extractEventTime(String(event.start_label ?? "")) && (
                        <span className="font-normal text-slate-500">
                          {" "}
                          · {extractEventTime(String(event.start_label ?? ""))}
                        </span>
                      )}
                    </p>
                    {Boolean(event.invitee_name) && (
                      <p className="mt-0.5 truncate text-slate-600">{String(event.invitee_name)}</p>
                    )}
                    {CALENDLY_WRITE_ENABLED && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onStartEdit(Number(event.id))}
                          className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-200 disabled:opacity-50"
                        >
                          {t("chat.calendlyEditAction")}
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onCancelEvent(Number(event.id))}
                          className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-200 disabled:opacity-50"
                        >
                          {t("chat.calendlyCancelAction")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {CALENDLY_WRITE_ENABLED && options.step === "event_type" && (
        <div className="flex flex-wrap gap-1.5">
          {options.event_types.map((item) => (
            <button
              key={String(item.uri)}
              type="button"
              disabled={disabled}
              onClick={() => onSelectEventType(String(item.uri), String(item.name))}
              className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100 disabled:opacity-50"
            >
              {String(item.index)}. {String(item.name)}
            </button>
          ))}
        </div>
      )}

      {CALENDLY_WRITE_ENABLED && options.step === "date" && (
        <div className="space-y-2">
          {Boolean(draft.event_type_name) && (
            <p className="text-[11px] text-violet-800">{String(draft.event_type_name)}</p>
          )}
          <Input
            id="chatCalendlyDate"
            type="date"
            min={toDateInputValue()}
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            disabled={disabled || !dateValue}
            onClick={() => onSelectDate(dateValue, draft)}
          >
            {t("chat.calendlyLoadSlots")}
          </Button>
        </div>
      )}

      {CALENDLY_WRITE_ENABLED && options.step === "slot" && (
        <div className="flex flex-wrap gap-1.5">
          {options.slots.map((slot) => (
            <button
              key={String(slot.start_time)}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSlot(String(slot.start_time), String(slot.label), draft)}
              className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100 disabled:opacity-50"
            >
              {String(slot.index)}. {String(slot.label)}
            </button>
          ))}
        </div>
      )}

      {CALENDLY_WRITE_ENABLED && options.step === "invitee" && (
        <form onSubmit={draft.mode === "update" ? handleUpdateSubmit : handleCreateSubmit} className="space-y-2">
          <Input
            id="chatCalendlyInviteeName"
            label={t("calendly.inviteeNameField")}
            value={inviteeName}
            onChange={(e) => setInviteeName(e.target.value)}
            required
            disabled={disabled}
          />
          <Input
            id="chatCalendlyInviteeEmail"
            label={t("calendly.inviteeEmailField")}
            type="email"
            value={inviteeEmail}
            onChange={(e) => setInviteeEmail(e.target.value)}
            required
            disabled={disabled}
          />
          <CalendlyCustomQuestionFields
            questions={customQuestions}
            values={questionAnswers}
            onChange={(questionUuid, value) =>
              setQuestionAnswers((current) => ({ ...current, [questionUuid]: value }))
            }
          />
          <Button type="submit" size="sm" disabled={disabled}>
            {draft.mode === "update" ? t("chat.calendlyUpdateAction") : t("chat.calendlyCreateAction")}
          </Button>
        </form>
      )}
    </div>
  );
}
