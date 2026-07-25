"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { useTranslation } from "@/contexts/LanguageContext";
import type { AdvisorOption } from "@/features/clients/hooks/useClientWorkflow";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import type { AdvisorBrief } from "@/types/api";

interface ClientAdvisorPanelProps {
  clientId: number;
  clientStatus: string;
  advisorsAssigned: AdvisorBrief[];
  token: string | null;
  advisors: AdvisorOption[];
  onAdvisorsUpdated: (advisors: AdvisorBrief[]) => void;
  onLoadAdvisors: () => Promise<AdvisorOption[]>;
  className?: string;
}

const STATUSES_REQUIRING_ADVISOR = new Set([
  "LISTO_PARA_TRABAJAR",
  "ONBOARDING_EN_PROGRESO",
  "ONBOARDING_COMPLETADO",
]);

export function ClientAdvisorPanel({
  clientId,
  clientStatus,
  advisorsAssigned,
  token,
  advisors,
  onAdvisorsUpdated,
  onLoadAdvisors,
  className = "",
}: ClientAdvisorPanelProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  const requiresAdvisor = STATUSES_REQUIRING_ADVISOR.has(clientStatus);
  const canRemoveAdvisor = (count: number) => count > 1 || (count === 1 && !requiresAdvisor);

  const assignedIds = useMemo(
    () => new Set(advisorsAssigned.map((item) => item.id)),
    [advisorsAssigned],
  );

  const availableAdvisors = useMemo(
    () => advisors.filter((item) => !assignedIds.has(item.id)),
    [advisors, assignedIds],
  );

  useEffect(() => {
    if (!adding) setSelectedId("");
  }, [adding]);

  async function startAdding() {
    setError(null);
    setAdding(true);
    if (!advisors.length) {
      setLoadingAdvisors(true);
      try {
        await onLoadAdvisors();
      } finally {
        setLoadingAdvisors(false);
      }
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const added = await api.post<AdvisorBrief>(
        `/clients/${clientId}/advisors`,
        { advisor_user_id: Number(selectedId) },
        token,
      );
      const next = advisorsAssigned.some((item) => item.id === added.id)
        ? advisorsAssigned
        : [...advisorsAssigned, added];
      onAdvisorsUpdated(next);
      setAdding(false);
      setSelectedId("");
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("common.error")));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(advisorUserId: number) {
    if (!token) return;
    setRemovingId(advisorUserId);
    setError(null);
    try {
      await api.delete(`/clients/${clientId}/advisors/${advisorUserId}`, token);
      onAdvisorsUpdated(advisorsAssigned.filter((item) => item.id !== advisorUserId));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("common.error")));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card className={`flex flex-col overflow-hidden p-4 sm:p-6 ${className}`.trim()}>
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {t("clientDetail.assignedAdvisors")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("clientDetail.assignedAdvisorsHint")}</p>
          {advisorsAssigned.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">{t("clientDetail.advisorAutoAssignHint")}</p>
          ) : null}
        </div>
        {!adding ? (
          <IconActionButton
            label={t("clientDetail.addAdvisor")}
            icon={<HiOutlinePlus />}
            variant="ghost"
            onClick={() => {
              void startAdding();
            }}
          />
        ) : null}
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
        <ul className="space-y-2">
          {advisorsAssigned.length === 0 ? (
            <li className="text-sm text-slate-500">{t("clientDetail.noAdvisorAssigned")}</li>
          ) : (
            advisorsAssigned.map((advisor) => (
              <li
                key={advisor.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {advisor.first_name} {advisor.last_name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{advisor.email}</p>
                </div>
                {canRemoveAdvisor(advisorsAssigned.length) ? (
                  <IconActionButton
                    label={t("clientDetail.removeAdvisor")}
                    icon={<HiOutlineTrash />}
                    variant="danger"
                    disabled={removingId === advisor.id || saving}
                    onClick={() => {
                      void handleRemove(advisor.id);
                    }}
                  />
                ) : null}
              </li>
            ))
          )}
        </ul>

        {adding ? (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-slate-100 pt-4">
            <select
              className="input-field w-full text-sm"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={saving || loadingAdvisors}
              required
            >
              <option value="">{t("clientDetail.selectAdvisor")}</option>
              {availableAdvisors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.first_name} {item.last_name} ({item.email})
                </option>
              ))}
            </select>
            {availableAdvisors.length === 0 && !loadingAdvisors ? (
              <p className="text-xs text-slate-500">{t("clientDetail.noMoreAdvisors")}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={saving || !selectedId}>
                {saving ? t("common.loading") : t("clientDetail.addAdvisor")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={() => {
                  setAdding(false);
                  setSelectedId("");
                  setError(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Card>
  );
}
