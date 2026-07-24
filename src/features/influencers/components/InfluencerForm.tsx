"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlySalesRep } from "@/features/calendly/types";
import type { InfluencerFormData } from "@/features/influencers/types";
import type { Sede } from "@/types/api";

interface InfluencerFormProps {
  form: InfluencerFormData;
  onChange: (form: InfluencerFormData) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  isEdit?: boolean;
  salesReps: CalendlySalesRep[];
  sedes?: Sede[];
  showSedeSelect?: boolean;
  formId?: string;
}

export function InfluencerForm({
  form,
  onChange,
  onSubmit,
  submitting,
  isEdit,
  salesReps,
  sedes = [],
  showSedeSelect = false,
  formId = "influencer-form",
}: InfluencerFormProps) {
  const { t } = useTranslation();

  const repsForSede =
    showSedeSelect && form.sede_id
      ? salesReps.filter((rep) => rep.sede_id === Number(form.sede_id))
      : salesReps;

  return (
    <form id={formId} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {showSedeSelect && !isEdit ? (
        <div className="sm:col-span-2">
          <Select
            label={t("users.sede")}
            required
            value={form.sede_id}
            onChange={(e) =>
              onChange({ ...form, sede_id: e.target.value, sales_rep_user_id: "" })
            }
          >
            <option value="">{t("users.selectSede")}</option>
            {sedes
              .filter((sede) => sede.is_active)
              .map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.name}
                </option>
              ))}
          </Select>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Input
          label={t("common.name")}
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder={t("influencers.namePlaceholder")}
        />
      </div>

      <Input
        label={t("influencers.handle")}
        value={form.handle}
        onChange={(e) => onChange({ ...form, handle: e.target.value })}
        placeholder="@usuario"
      />

      <Select
        label={t("influencers.salesRep")}
        required
        disabled={showSedeSelect && !form.sede_id && !isEdit}
        value={form.sales_rep_user_id}
        onChange={(e) => onChange({ ...form, sales_rep_user_id: e.target.value })}
      >
        <option value="">
          {showSedeSelect && !form.sede_id && !isEdit
            ? t("prospects.selectSedeFirst")
            : t("prospects.selectSalesRep")}
        </option>
        {repsForSede.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.first_name} {rep.last_name}
          </option>
        ))}
      </Select>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700">
          {t("influencers.notes")}
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
            placeholder={t("influencers.notesPlaceholder")}
          />
        </label>
      </div>

      <div className="sm:col-span-2 hidden">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("common.loading") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
