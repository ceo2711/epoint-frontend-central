"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CalendlyTokenForm } from "@/features/calendly/components/CalendlyTokenForm";
import { useTranslation } from "@/contexts/LanguageContext";

interface CalendlySettingsModalProps {
  schedulingUrl?: string | null;
  onClose: () => void;
  onUpdateToken: (accessToken: string, schedulingUrl?: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function CalendlySettingsModal({
  schedulingUrl,
  onClose,
  onUpdateToken,
  onDisconnect,
}: CalendlySettingsModalProps) {
  const { t } = useTranslation();

  async function handleUpdateToken(accessToken: string, url?: string) {
    await onUpdateToken(accessToken, url);
    onClose();
  }

  async function handleDisconnect() {
    await onDisconnect();
    onClose();
  }

  return (
    <Modal
      title={t("calendly.settingsTitle")}
      subtitle={t("calendly.settingsSubtitle")}
      onClose={onClose}
      size="lg"
    >
      <CalendlyTokenForm
        idPrefix="calendlySettings"
        defaultSchedulingUrl={schedulingUrl ?? ""}
        onSubmit={handleUpdateToken}
        submitLabel={t("calendly.updateTokenAction")}
        submittingLabel={t("calendly.updatingToken")}
      />

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-sm text-slate-500">{t("calendly.disconnectHint")}</p>
        <Button type="button" variant="danger" className="mt-3" onClick={() => void handleDisconnect()}>
          {t("calendly.disconnect")}
        </Button>
      </div>
    </Modal>
  );
}
