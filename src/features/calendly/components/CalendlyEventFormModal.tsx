"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { CalendlyCustomQuestionFields } from "@/features/calendly/components/CalendlyCustomQuestionFields";
import type {
  CalendlyAvailableTime,
  CalendlyCustomQuestion,
  CalendlyEvent,
  CalendlyEventFormValues,
  CalendlyEventType,
} from "@/features/calendly/types";
import { clampDateInputValue, getAvailableTimesRange, toDateInputValue } from "@/features/calendly/utils/dateRange";

interface CalendlyEventFormModalProps {
  mode: "create" | "edit";
  event?: CalendlyEvent;
  initialDate?: Date;
  eventTypes: CalendlyEventType[];
  loadingEventTypes: boolean;
  onLoadAvailableTimes: (eventTypeUri: string, date: string) => Promise<CalendlyAvailableTime[]>;
  onLoadEventTypeDetail: (eventTypeUri: string) => Promise<CalendlyEventType>;
  onSubmit: (values: CalendlyEventFormValues) => Promise<void>;
  onClose: () => void;
}

function formatSlotLabel(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale === "es" ? "es-AR" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseStoredAnswers(
  comment: string | null | undefined,
  questions: CalendlyCustomQuestion[],
): Record<string, string> {
  if (!comment) return {};

  const parsed: Record<string, string> = {};
  for (const line of comment.split("\n")) {
    const separatorIndex = line.indexOf(": ");
    if (separatorIndex === -1) continue;
    const name = line.slice(0, separatorIndex).trim();
    const answer = line.slice(separatorIndex + 2).trim();
    const question = questions.find((item) => item.name === name);
    if (question) {
      parsed[question.uuid] = answer;
    }
  }
  return parsed;
}

function buildQuestionsPayload(
  questions: CalendlyCustomQuestion[],
  values: Record<string, string>,
) {
  return questions.map((question) => {
    let answer = values[question.uuid]?.trim() ?? "";
    if (question.type === "single_select" && answer === "__other__") {
      answer = values[`${question.uuid}__other`]?.trim() ?? "";
    }
    return {
      question_uuid: question.uuid,
      answer,
    };
  });
}

function validateCustomQuestions(
  questions: CalendlyCustomQuestion[],
  values: Record<string, string>,
) {
  for (const question of questions) {
    if (!question.required) continue;
    const payload = buildQuestionsPayload([question], values)[0];
    if (!payload.answer) {
      return question.name;
    }
  }
  return null;
}

export function CalendlyEventFormModal({
  mode,
  event,
  initialDate,
  eventTypes,
  loadingEventTypes,
  onLoadAvailableTimes,
  onLoadEventTypeDetail,
  onSubmit,
  onClose,
}: CalendlyEventFormModalProps) {
  const { t, locale } = useTranslation();
  const defaultDate = initialDate ?? (event ? new Date(event.start_time) : new Date());
  const minDateValue = toDateInputValue(new Date());

  const [eventTypeUri, setEventTypeUri] = useState(event?.event_type_uri ?? eventTypes[0]?.uri ?? "");
  const [dateValue, setDateValue] = useState(clampDateInputValue(defaultDate));
  const [slotValue, setSlotValue] = useState(event?.start_time ?? "");
  const [inviteeName, setInviteeName] = useState(event?.invitee_name ?? "");
  const [inviteeEmail, setInviteeEmail] = useState(event?.invitee_email ?? "");
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [eventTypeDetail, setEventTypeDetail] = useState<CalendlyEventType | null>(null);
  const [loadingEventTypeDetail, setLoadingEventTypeDetail] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<CalendlyAvailableTime[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [slotsMessage, setSlotsMessage] = useState("");

  useEffect(() => {
    if (!eventTypeUri && eventTypes[0]?.uri) {
      setEventTypeUri(eventTypes[0].uri);
    }
  }, [eventTypeUri, eventTypes]);

  const selectedEventType = useMemo(
    () => eventTypeDetail ?? eventTypes.find((item) => item.uri === eventTypeUri),
    [eventTypeDetail, eventTypes, eventTypeUri],
  );

  const customQuestions = useMemo(
    () => selectedEventType?.custom_questions ?? [],
    [selectedEventType],
  );

  useEffect(() => {
    if (!eventTypeUri) return;

    let cancelled = false;
    async function loadDetail() {
      setLoadingEventTypeDetail(true);
      try {
        const detail = await onLoadEventTypeDetail(eventTypeUri);
        if (cancelled) return;
        setEventTypeDetail({
          ...detail,
          description: detail.description ?? null,
          custom_questions: detail.custom_questions ?? [],
        });
      } catch {
        if (!cancelled) {
          setEventTypeDetail(eventTypes.find((item) => item.uri === eventTypeUri) ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoadingEventTypeDetail(false);
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [eventTypeUri, eventTypes, onLoadEventTypeDetail]);

  useEffect(() => {
    if (!selectedEventType) return;
    const questions = selectedEventType.custom_questions ?? [];
    const initialAnswers =
      mode === "edit" && event?.invitee_comment
        ? parseStoredAnswers(event.invitee_comment, questions)
        : {};
    setQuestionAnswers(initialAnswers);
  }, [selectedEventType?.uri, selectedEventType?.custom_questions, mode, event?.invitee_comment]);

  useEffect(() => {
    if (!eventTypeUri || !dateValue) return;

    let cancelled = false;
    async function loadSlots() {
      setLoadingSlots(true);
      setError("");
      setSlotsMessage("");

      if (!getAvailableTimesRange(dateValue)) {
        if (!cancelled) {
          setAvailableSlots([]);
          setSlotValue("");
          setSlotsMessage(t("calendly.pastDateSlots"));
          setLoadingSlots(false);
        }
        return;
      }

      try {
        const slots = await onLoadAvailableTimes(eventTypeUri, dateValue);
        if (cancelled) return;
        setAvailableSlots(slots);
        if (slots.length === 0) {
          setSlotValue("");
          setSlotsMessage(t("calendly.noAvailableSlots"));
          return;
        }
        setSlotValue((current) => {
          if (current && slots.some((slot) => slot.start_time === current)) {
            return current;
          }
          if (event && slots.some((slot) => slot.start_time === event.start_time)) {
            return event.start_time;
          }
          return slots[0].start_time;
        });
      } catch (err) {
        if (!cancelled) {
          setAvailableSlots([]);
          setSlotValue("");
          setSlotsMessage(err instanceof Error ? err.message : t("calendly.slotsError"));
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    void loadSlots();
    return () => {
      cancelled = true;
    };
  }, [eventTypeUri, dateValue, onLoadAvailableTimes, t, event?.start_time]);

  function handleQuestionChange(questionUuid: string, value: string) {
    setQuestionAnswers((current) => ({ ...current, [questionUuid]: value }));
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!eventTypeUri || !slotValue || !inviteeName.trim() || !inviteeEmail.trim()) {
      setError(t("calendly.formIncomplete"));
      return;
    }

    const missingQuestion = validateCustomQuestions(customQuestions, questionAnswers);
    if (missingQuestion) {
      setError(t("calendly.customQuestionRequired", { field: missingQuestion }));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        event_type_uri: eventTypeUri,
        start_time: slotValue,
        invitee_name: inviteeName.trim(),
        invitee_email: inviteeEmail.trim(),
        questions_and_answers: buildQuestionsPayload(customQuestions, questionAnswers),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("calendly.saveEventError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? t("calendly.createEventTitle") : t("calendly.editEventTitle")}
      subtitle={mode === "edit" ? t("calendly.editEventSubtitle") : t("calendly.createEventSubtitle")}
      onClose={onClose}
      size="lg"
    >
      {loadingEventTypes ? (
        <div className="py-8">
          <LoadingSpinner label={t("calendly.loadingEventTypes")} />
        </div>
      ) : eventTypes.length === 0 ? (
        <p className="text-sm text-slate-600">{t("calendly.noEventTypes")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}

          <div>
            <label className="input-label" htmlFor="calendlyEventType">
              {t("calendly.eventTypeField")}
            </label>
            <select
              id="calendlyEventType"
              className="input-field mt-1"
              value={eventTypeUri}
              onChange={(e) => setEventTypeUri(e.target.value)}
            >
              {eventTypes.map((item) => (
                <option key={item.uri} value={item.uri}>
                  {item.name} ({item.duration} min)
                </option>
              ))}
            </select>
            {selectedEventType?.description && (
              <p className="mt-2 text-sm text-slate-600">{selectedEventType.description}</p>
            )}
          </div>

          <Input
            id="calendlyEventDate"
            label={t("calendly.eventDateField")}
            type="date"
            min={minDateValue}
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            required
          />

          <div>
            <label className="input-label" htmlFor="calendlyEventSlot">
              {t("calendly.eventSlotField")}
            </label>
            {loadingSlots ? (
              <div className="mt-2">
                <LoadingSpinner label={t("calendly.loadingSlots")} />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{slotsMessage || t("calendly.noAvailableSlots")}</p>
            ) : (
              <select
                id="calendlyEventSlot"
                className="input-field mt-1"
                value={slotValue}
                onChange={(e) => setSlotValue(e.target.value)}
                required
              >
                {availableSlots.map((slot) => (
                  <option key={slot.start_time} value={slot.start_time}>
                    {formatSlotLabel(slot.start_time, locale)}
                  </option>
                ))}
              </select>
            )}
            {selectedEventType && (
              <p className="mt-1 text-xs text-slate-500">
                {t("calendly.durationHint", { minutes: String(selectedEventType.duration) })}
              </p>
            )}
          </div>

          <Input
            id="calendlyInviteeName"
            label={t("calendly.inviteeNameField")}
            value={inviteeName}
            onChange={(e) => setInviteeName(e.target.value)}
            required
          />
          <Input
            id="calendlyInviteeEmail"
            label={t("calendly.inviteeEmailField")}
            type="email"
            value={inviteeEmail}
            onChange={(e) => setInviteeEmail(e.target.value)}
            required
          />

          <CalendlyCustomQuestionFields
            questions={customQuestions}
            values={questionAnswers}
            onChange={handleQuestionChange}
            loading={loadingEventTypeDetail}
          />

          <div className="modal-actions !mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting || loadingSlots || !slotValue}>
              {submitting ? t("calendly.savingEvent") : t("calendly.saveEvent")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
