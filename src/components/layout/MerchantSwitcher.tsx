"use client";

import { useMerchant } from "@/contexts/MerchantContext";
import { useTranslation } from "@/contexts/LanguageContext";

interface MerchantSwitcherProps {
  collapsed?: boolean;
}

export function MerchantSwitcher({ collapsed = false }: MerchantSwitcherProps) {
  const { t } = useTranslation();
  const { merchants, activeMerchantId, switching, switchMerchant, isStaff } = useMerchant();

  if (!isStaff || merchants.length === 0) return null;

  const activeMerchant = merchants.find((merchant) => merchant.id === activeMerchantId);

  return (
    <div className={`px-3 pb-3 ${collapsed ? "lg:px-2" : ""}`}>
      <label
        htmlFor="sidebar-merchant-select"
        className={`sidebar-field-label ${collapsed ? "lg:sr-only" : ""}`}
      >
        {t("merchant.activeWorkspace")}
      </label>
      <select
        id="sidebar-merchant-select"
        value={activeMerchantId ?? ""}
        onChange={(event) => {
          const nextId = Number(event.target.value);
          if (nextId) void switchMerchant(nextId);
        }}
        disabled={switching || merchants.length <= 1}
        title={activeMerchant?.name}
        className={`sidebar-select ${collapsed ? "lg:px-2 lg:text-xs" : ""}`}
      >
        {merchants.map((merchant) => (
          <option key={merchant.id} value={merchant.id}>
            {merchant.name}
          </option>
        ))}
      </select>
    </div>
  );
}
