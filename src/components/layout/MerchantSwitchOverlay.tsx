"use client";

import { useMerchant } from "@/contexts/MerchantContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function MerchantSwitchOverlay() {
  const { switching } = useMerchant();
  const { t } = useTranslation();

  if (!switching) return null;

  return (
    <div
      className="merchant-switch-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner label={t("merchant.switching")} />
    </div>
  );
}
