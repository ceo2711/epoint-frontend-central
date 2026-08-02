"use client";

import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useSourceOptions } from "@/features/sources/hooks/useSourceOptions";
import {
  CLIENT_SOURCE_LABEL_KEYS,
  CLIENT_SOURCE_VALUES,
  type ClientSourceValue,
} from "@/features/clients/constants";

interface ClientSourceSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Códigos de fuente que no se pueden elegir (p. ej. INFLUENCERS sin registros). */
  disabledCodes?: readonly string[];
  hint?: string;
}

export function ClientSourceSelect({
  value,
  onChange,
  required,
  disabled,
  disabledCodes = [],
  hint,
}: ClientSourceSelectProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { options, loading } = useSourceOptions(token);
  const blocked = new Set(disabledCodes);

  const items =
    options.length > 0
      ? options.map((source) => ({ code: source.code, label: source.name }))
      : CLIENT_SOURCE_VALUES.map((code) => ({
          code,
          label: t(CLIENT_SOURCE_LABEL_KEYS[code as ClientSourceValue]),
        }));

  return (
    <div>
      <Select
        label={t("clients.source")}
        required={required}
        disabled={disabled || loading}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("clients.selectSource")}</option>
        {items.map((source) => (
          <option key={source.code} value={source.code} disabled={blocked.has(source.code)}>
            {source.label}
            {blocked.has(source.code) ? ` — ${t("prospects.sourceUnavailable")}` : ""}
          </option>
        ))}
      </Select>
      {hint ? <p className="mt-1.5 text-xs text-amber-700">{hint}</p> : null}
    </div>
  );
}
