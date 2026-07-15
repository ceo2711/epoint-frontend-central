"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import type { AdvisorOption } from "@/features/clients/hooks/useClientWorkflow";
import { ApiError, api } from "@/lib/api";
import type { AdvisorBrief } from "@/types/api";

interface ClientAdvisorPanelProps {
  clientId: number;
  advisor: AdvisorBrief | null;
  token: string | null;
  advisors: AdvisorOption[];
  onAdvisorUpdated: (advisor: AdvisorBrief) => void;
  onLoadAdvisors: () => Promise<AdvisorOption[]>;
}

export function ClientAdvisorPanel({
  clientId,
  advisor,
  token,
  advisors,
  onAdvisorUpdated,
  onLoadAdvisors,
}: ClientAdvisorPanelProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(advisor ? String(advisor.id) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  useEffect(() => {
    setSelectedId(advisor ? String(advisor.id) : "");
  }, [advisor]);

  async function startEditing() {
    setError(null);
    setEditing(true);
    if (!advisors.length) {
      setLoadingAdvisors(true);
      try {
        await onLoadAdvisors();
      } finally {
        setLoadingAdvisors(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<AdvisorBrief>(
        `/clients/${clientId}/advisor`,
        { advisor_user_id: Number(selectedId) },
        token,
      );
      onAdvisorUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("common.error")));
    } finally {
      setSaving(false);
    }
  }

  const advisorLabel = advisor
    ? `${advisor.first_name} ${advisor.last_name} (${advisor.email})`
    : t("clientDetail.noAdvisorAssigned");

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {t("clientDetail.assignedAdvisor")}
          </h2>
          {!editing ? (
            <p className="mt-2 text-sm font-semibold text-slate-900">{advisorLabel}</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              <select
                className="input-field w-full max-w-md text-sm"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                disabled={saving || loadingAdvisors}
                required
              >
                <option value="">{t("clientDetail.selectAdvisor")}</option>
                {advisors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.first_name} {item.last_name} ({item.email})
                  </option>
                ))}
              </select>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={saving || !selectedId}>
                  {saving ? t("common.loading") : t("common.saveChanges")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => {
                    setEditing(false);
                    setSelectedId(advisor ? String(advisor.id) : "");
                    setError(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          )}
        </div>
        {!editing && (
          <Button size="sm" variant="secondary" onClick={() => void startEditing()}>
            {advisor ? t("clientDetail.changeAdvisor") : t("clientDetail.assignAdvisor")}
          </Button>
        )}
      </div>
    </Card>
  );
}
