"use client";

import { useTranslation } from "@/contexts/LanguageContext";

export function parseQualificationValue(raw: string): boolean | null {
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

export function qualificationSelectValue(value: boolean | null | undefined): "" | "1" | "0" {
  if (value === true) return "1";
  if (value === false) return "0";
  return "";
}

interface ProspectQualificationFieldProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  variant?: "select" | "radio";
}

export function ProspectQualificationField({
  value,
  onChange,
  variant = "select",
}: ProspectQualificationFieldProps) {
  const { t } = useTranslation();

  if (variant === "radio") {
    return (
      <div className="sm:col-span-2">
        <p className="mb-2 text-sm font-medium text-slate-700">{t("prospects.qualification")}</p>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <input
              type="radio"
              name="is_qualified"
              checked={value === null}
              onChange={() => onChange(null)}
            />
            {t("prospects.qualificationLater")}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <input
              type="radio"
              name="is_qualified"
              checked={value === true}
              onChange={() => onChange(true)}
            />
            {t("prospects.qualified")}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <input
              type="radio"
              name="is_qualified"
              checked={value === false}
              onChange={() => onChange(false)}
            />
            {t("prospects.unqualified")}
          </label>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">{t("prospects.qualificationHint")}</p>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2">
      <p className="mb-1.5 text-sm font-medium text-slate-700">{t("prospects.qualification")}</p>
      <select
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        value={qualificationSelectValue(value)}
        onChange={(e) => onChange(parseQualificationValue(e.target.value))}
      >
        <option value="">{t("prospects.qualificationLater")}</option>
        <option value="1">{t("prospects.qualified")}</option>
        <option value="0">{t("prospects.unqualified")}</option>
      </select>
      <p className="mt-1.5 text-xs text-slate-500">{t("prospects.qualificationHint")}</p>
    </div>
  );
}
