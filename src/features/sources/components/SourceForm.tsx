"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { SourceFormData } from "@/features/sources/types";

interface SourceFormProps {
  form: SourceFormData;
  onChange: (form: SourceFormData) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  isEdit?: boolean;
  embedded?: boolean;
  formId?: string;
}

export function SourceForm({
  form,
  onChange,
  onSubmit,
  submitting,
  isEdit,
  embedded,
  formId = "source-form",
}: SourceFormProps) {
  const { t } = useTranslation();

  const formContent = (
    <form id={formId} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Input
        label={t("sources.code")}
        required
        disabled={isEdit}
        value={form.code}
        onChange={(e) =>
          onChange({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })
        }
        placeholder="INFLUENCERS"
      />
      <Input
        label={t("common.name")}
        required
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        placeholder="Influencers"
      />
      <div className="sm:col-span-2">
        <Input
          label={t("sources.description")}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder={t("sources.descriptionPlaceholder")}
        />
      </div>
      {!embedded ? (
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      ) : null}
    </form>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card className="mb-6 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
        {isEdit ? t("sources.edit") : t("sources.new")}
      </h3>
      {formContent}
    </Card>
  );
}
