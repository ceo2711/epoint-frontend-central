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
}

export function ClientSourceSelect({ value, onChange, required, disabled }: ClientSourceSelectProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { options, loading } = useSourceOptions(token);

  const items =
    options.length > 0
      ? options.map((source) => ({ code: source.code, label: source.name }))
      : CLIENT_SOURCE_VALUES.map((code) => ({
          code,
          label: t(CLIENT_SOURCE_LABEL_KEYS[code as ClientSourceValue]),
        }));

  return (
    <Select
      label={t("clients.source")}
      required={required}
      disabled={disabled || loading}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{t("clients.selectSource")}</option>
      {items.map((source) => (
        <option key={source.code} value={source.code}>
          {source.label}
        </option>
      ))}
    </Select>
  );
}
