"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import type { Client, Vehicle } from "@/types/api";

interface StaffClientVehicleCardProps {
  client: Client;
  token: string | null;
  canEdit: boolean;
  onUpdated: () => void;
}

function currentYear() {
  return new Date().getFullYear();
}

function digitsOnly(value: string, maxLen: number): string {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

function emptyForm() {
  return { model: "", year: "", color: "", license_plate: "" };
}

export function StaffClientVehicleCard({
  client,
  token,
  canEdit,
  onUpdated,
}: StaffClientVehicleCardProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<{ model?: string; year?: string; color?: string }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const primary = client.vehicles?.find((item) => item.order === 1);
    if (!primary) {
      setForm(emptyForm());
      return;
    }
    setForm({
      model: primary.model,
      year: String(primary.year),
      color: primary.color,
      license_plate: primary.license_plate ?? "",
    });
  }, [client.id, client.vehicles]);

  function validate() {
    const next: { model?: string; year?: string; color?: string } = {};
    const maxYear = currentYear();
    const year = Number(form.year.trim());
    if (!form.model.trim()) next.model = t("portalData.vehicleModelRequired");
    if (!form.color.trim()) next.color = t("portalData.vehicleColorRequired");
    if (!form.year.trim()) {
      next.year = t("portalData.vehicleYearRequired");
    } else if (
      form.year.trim().length !== 4 ||
      Number.isNaN(year) ||
      year < 1900 ||
      year > maxYear
    ) {
      next.year = t("portalData.vehicleYearInvalid", { year: String(maxYear) });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !canEdit) return;
    setMessage("");
    setError("");
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post(
        `/clients/${client.id}/vehicles`,
        {
          order: 1,
          model: form.model.trim(),
          year: Number(form.year.trim()),
          color: form.color.trim(),
          license_plate: form.license_plate.trim() || null,
        },
        token,
      );
      setMessage(t("clientDetail.vehicleSaved"));
      onUpdated();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("clientDetail.vehicleSaveError")));
    } finally {
      setSaving(false);
    }
  }

  const vehicles = client.vehicles ?? [];

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
        {t("clientDetail.vehicles")}
      </h2>
      <p className="mb-4 text-sm text-slate-500">{t("clientDetail.vehicleOptionalHint")}</p>

      {vehicles.length > 0 ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {vehicles.map((v: Vehicle) => (
            <div key={v.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-bold uppercase text-slate-400">
                {t("clientDetail.vehicleN", { n: v.order })}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {v.model} · {v.year} · {v.color}
                {v.license_plate ? ` · ${v.license_plate}` : ""}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-400">{t("clientDetail.noVehicles")}</p>
      )}

      {canEdit ? (
        <form onSubmit={onSave} className="space-y-4 border-t border-slate-100 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="staff-vehicle-model"
              label={t("portalData.model")}
              value={form.model}
              onChange={(e) => {
                setForm({ ...form, model: e.target.value });
                if (errors.model) setErrors((prev) => ({ ...prev, model: undefined }));
              }}
              error={errors.model}
            />
            <Input
              id="staff-vehicle-year"
              label={t("portalData.year")}
              inputMode="numeric"
              maxLength={4}
              value={form.year}
              onChange={(e) => {
                setForm({ ...form, year: digitsOnly(e.target.value, 4) });
                if (errors.year) setErrors((prev) => ({ ...prev, year: undefined }));
              }}
              placeholder={t("portalData.vehicleYearPlaceholder")}
              error={errors.year}
            />
            <Input
              id="staff-vehicle-color"
              label={t("portalData.color")}
              value={form.color}
              onChange={(e) => {
                setForm({ ...form, color: e.target.value });
                if (errors.color) setErrors((prev) => ({ ...prev, color: undefined }));
              }}
              error={errors.color}
            />
          </div>
          <Input
            id="staff-vehicle-plate"
            label={t("portalData.licensePlate")}
            help={t("portalData.licensePlateHint")}
            value={form.license_plate}
            onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
            placeholder={t("portalData.licensePlatePlaceholder")}
          />
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("common.loading") : t("clientDetail.saveVehicle")}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
