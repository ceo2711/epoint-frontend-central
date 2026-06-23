"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { MerchantFormData } from "@/features/merchants/types";

interface MerchantFormProps {
  form: MerchantFormData;
  onChange: (form: MerchantFormData) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  isEdit?: boolean;
}

export function MerchantForm({ form, onChange, onSubmit, submitting, isEdit }: MerchantFormProps) {
  const { t } = useTranslation();

  return (
    <Card className="mb-6 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
        {isEdit ? t("merchants.edit") : t("merchants.new")}
      </h3>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("merchants.code")}
          required
          disabled={isEdit}
          value={form.code}
          onChange={(e) => onChange({ ...form, code: e.target.value.toLowerCase() })}
          placeholder="epoint-lab"
        />
        <Input
          label={t("common.name")}
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="ePoint Lab"
        />
        <div className="sm:col-span-2">
          <Input
            label={t("merchants.description")}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder={t("merchants.descriptionPlaceholder")}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
