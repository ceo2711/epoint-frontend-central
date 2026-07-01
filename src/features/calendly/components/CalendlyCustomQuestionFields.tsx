"use client";

import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlyCustomQuestion } from "@/features/calendly/types";

interface CalendlyCustomQuestionFieldsProps {
  questions: CalendlyCustomQuestion[];
  values: Record<string, string>;
  onChange: (questionUuid: string, value: string) => void;
  loading?: boolean;
}

export function CalendlyCustomQuestionFields({
  questions,
  values,
  onChange,
  loading = false,
}: CalendlyCustomQuestionFieldsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="border-t border-slate-100 pt-4">
        <LoadingSpinner label={t("calendly.loadingCustomQuestions")} />
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      <p className="text-sm font-medium text-slate-900">{t("calendly.customQuestionsTitle")}</p>
      {questions.map((question) => {
        const fieldId = `calendlyQuestion-${question.uuid}`;
        const value = values[question.uuid] ?? "";
        const label = question.required ? `${question.name} *` : question.name;

        if (question.type === "text" || question.type === "multi_line") {
          return (
            <div key={question.uuid}>
              <label className="input-label" htmlFor={fieldId}>
                {label}
              </label>
              <textarea
                id={fieldId}
                className="input-field mt-1 min-h-[5rem] resize-y"
                value={value}
                onChange={(e) => onChange(question.uuid, e.target.value)}
                required={question.required}
                maxLength={2000}
              />
            </div>
          );
        }

        if (question.type === "single_select") {
          const choices = question.answer_choices ?? [];
          return (
            <div key={question.uuid}>
              <label className="input-label" htmlFor={fieldId}>
                {label}
              </label>
              <select
                id={fieldId}
                className="input-field mt-1"
                value={value}
                onChange={(e) => onChange(question.uuid, e.target.value)}
                required={question.required}
              >
                <option value="">{t("calendly.customQuestionSelectPlaceholder")}</option>
                {choices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
                {question.include_other && (
                  <option value="__other__">{t("calendly.customQuestionOther")}</option>
                )}
              </select>
              {value === "__other__" && (
                <Input
                  id={`${fieldId}-other`}
                  className="mt-2"
                  label={t("calendly.customQuestionOtherLabel")}
                  value={values[`${question.uuid}__other`] ?? ""}
                  onChange={(e) => onChange(`${question.uuid}__other`, e.target.value)}
                  required={question.required}
                />
              )}
            </div>
          );
        }

        if (question.type === "multi_select") {
          const choices = question.answer_choices ?? [];
          const selected = value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

          function toggleChoice(choice: string) {
            const next = selected.includes(choice)
              ? selected.filter((item) => item !== choice)
              : [...selected, choice];
            onChange(question.uuid, next.join(", "));
          }

          return (
            <fieldset key={question.uuid} className="space-y-2">
              <legend className="input-label">{label}</legend>
              {choices.map((choice) => (
                <label key={choice} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selected.includes(choice)}
                    onChange={() => toggleChoice(choice)}
                  />
                  {choice}
                </label>
              ))}
            </fieldset>
          );
        }

        return (
          <Input
            key={question.uuid}
            id={fieldId}
            label={label}
            type={question.type === "phone_number" ? "tel" : "text"}
            value={value}
            onChange={(e) => onChange(question.uuid, e.target.value)}
            required={question.required}
            maxLength={2000}
          />
        );
      })}
    </div>
  );
}
