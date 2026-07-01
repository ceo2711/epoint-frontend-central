"use client";

import { CalendlyTokenForm } from "@/features/calendly/components/CalendlyTokenForm";
import { useTranslation } from "@/contexts/LanguageContext";

interface CalendlyConnectPanelProps {
  onConnect: (accessToken: string, schedulingUrl?: string) => Promise<void>;
}

export function CalendlyConnectPanel({ onConnect }: CalendlyConnectPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="card-flat space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("calendly.connectTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("calendly.connectSubtitle")}</p>
      </div>

      <CalendlyTokenForm
        onSubmit={onConnect}
        submitLabel={t("calendly.connectAction")}
        submittingLabel={t("calendly.connecting")}
      />
    </div>
  );
}
