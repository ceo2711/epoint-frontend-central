"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/Input";
import {
  DATE_INPUT_PLACEHOLDER,
  formatDateInput,
  maskDateInput,
  parseDateInputToIso,
} from "@/lib/format-datetime";

interface DateInputProps {
  id?: string;
  label?: string;
  help?: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

export function DateInput({
  id,
  label,
  help,
  value,
  onChange,
  error,
  hint = DATE_INPUT_PLACEHOLDER,
  required,
  disabled,
}: DateInputProps) {
  const [draft, setDraft] = useState(() => formatDateInput(value));

  useEffect(() => {
    setDraft(formatDateInput(value));
  }, [value]);

  return (
    <div>
      <Input
        id={id}
        label={label}
        help={help}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder={DATE_INPUT_PLACEHOLDER}
        maxLength={10}
        required={required}
        disabled={disabled}
        value={draft}
        error={error}
        onChange={(e) => {
          const next = maskDateInput(e.target.value);
          setDraft(next);
          if (!next.trim()) {
            onChange("");
            return;
          }
          const iso = parseDateInputToIso(next);
          if (iso) onChange(iso);
        }}
        onBlur={() => {
          if (!draft.trim()) {
            setDraft("");
            onChange("");
            return;
          }
          const iso = parseDateInputToIso(draft);
          if (iso) {
            setDraft(formatDateInput(iso));
            onChange(iso);
            return;
          }
          setDraft(formatDateInput(value));
        }}
      />
      {!error && hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
