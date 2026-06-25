"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";

interface OnboardingReminderRunResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  dry_run: boolean;
}

interface OnboardingReminderConfig {
  interval_minutes: number;
  automatic_enabled: boolean;
  dry_run: boolean;
}

interface OnboardingRemindersButtonProps {
  token: string | null;
}

export function OnboardingRemindersButton({ token }: OnboardingRemindersButtonProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const [running, setRunning] = useState(false);
  const [config, setConfig] = useState<OnboardingReminderConfig | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<OnboardingReminderConfig>("/onboarding-reminders/config", token)
      .then(setConfig)
      .catch(() => setConfig(null));
  }, [token]);

  async function handleRun() {
    if (!token || running) return;

    const confirmed = await modal.confirm({
      title: t("clients.remindersRunTitle"),
      message: t("clients.remindersRunConfirm"),
      confirmLabel: t("clients.remindersRunAction"),
      cancelLabel: t("common.cancel"),
    });
    if (!confirmed) return;

    setRunning(true);
    try {
      const result = await api.post<OnboardingReminderRunResult>(
        "/onboarding-reminders/run",
        {},
        token,
      );

      const statsMessage = t("clients.remindersRunSuccessMessage", {
        processed: String(result.processed),
        sent: String(result.sent),
        skipped: String(result.skipped),
        failed: String(result.failed),
      });
      const dryRunNote = result.dry_run ? `\n\n${t("clients.remindersRunDryRunNote")}` : "";
      const noSentNote =
        result.sent === 0 && result.failed === 0
          ? `\n\n${t("clients.remindersRunNoSentNote")}`
          : "";

      let variant: "success" | "warning" | "info" = "success";
      if (result.failed > 0) variant = "warning";
      else if (result.dry_run || result.sent === 0) variant = "info";

      await modal.alert({
        title: t("clients.remindersRunSuccessTitle"),
        message: `${statsMessage}${dryRunNote}${noSentNote}`,
        variant,
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: err instanceof ApiError ? err.message : t("clients.remindersRunError"),
        variant: "error",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" onClick={() => void handleRun()} disabled={running}>
        {running ? t("clients.remindersRunning") : t("clients.remindersRunAction")}
      </Button>
      {config?.automatic_enabled ? (
        <p className="text-xs text-muted-foreground">
          {t("clients.remindersAutoEnabled", { minutes: String(config.interval_minutes) })}
        </p>
      ) : config ? (
        <p className="text-xs text-muted-foreground">{t("clients.remindersDisabled")}</p>
      ) : null}
    </div>
  );
}
