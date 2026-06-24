"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import type { Locale } from "@/i18n";

const options: { code: Locale; label: string }[] = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export function LanguageSwitcher({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className={`flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 ${className}`}
      role="group"
      aria-label={t("language.label")}
    >
      {options.map(({ code, label }) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              active
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-pressed={active}
            title={t(`language.${code}`)}
          >
            {compact ? label : t(`language.${code}`)}
          </button>
        );
      })}
    </div>
  );
}
