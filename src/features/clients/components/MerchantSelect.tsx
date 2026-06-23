"use client";

import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Merchant } from "@/features/merchants/types";

interface MerchantSelectProps {
  merchants: Array<Pick<Merchant, "id" | "name">>;
  value: string;
  onChange: (merchantId: string) => void;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function MerchantSelect({
  merchants,
  value,
  onChange,
  required,
  disabled,
  loading,
}: MerchantSelectProps) {
  const { t } = useTranslation();

  return (
    <Select
      label={t("clients.merchant")}
      required={required}
      disabled={disabled || loading}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{loading ? t("common.loading") : t("clients.selectMerchant")}</option>
      {merchants.map((merchant) => (
        <option key={merchant.id} value={merchant.id}>
          {merchant.name}
        </option>
      ))}
    </Select>
  );
}
