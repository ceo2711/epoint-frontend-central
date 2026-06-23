"use client";

import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/contexts/LanguageContext";
import { CLIENT_SOURCE_LABEL_KEYS, CLIENT_SOURCE_VALUES } from "@/features/clients/constants";

interface ClientSourceSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function ClientSourceSelect({ value, onChange, required, disabled }: ClientSourceSelectProps) {
  const { t } = useTranslation();

  return (
    <Select
      label={t("clients.source")}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{t("clients.selectSource")}</option>
      {CLIENT_SOURCE_VALUES.map((source) => (
        <option key={source} value={source}>
          {t(CLIENT_SOURCE_LABEL_KEYS[source])}
        </option>
      ))}
    </Select>
  );
}
