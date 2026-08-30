"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/contexts/LanguageContext";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 3v1.5M12 19.5V21M4.93 4.93l1.06 1.06M18.01 18.01l1.06 1.06M3 12h1.5M19.5 12H21M4.93 19.07l1.06-1.06M18.01 5.99l1.06-1.06"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 14.5A8.5 8.5 0 1111.5 3 6.5 6.5 0 0021 14.5z"
      />
    </svg>
  );
}

export function ThemeToggle({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const sm = size === "sm";
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-brand/30 hover:bg-cream-100 hover:text-slate-900 ${
        sm ? "h-7 w-7" : "h-9 w-9"
      } ${className}`}
      aria-label={isDark ? t("theme.toggleToLight") : t("theme.toggleToDark")}
      title={isDark ? t("theme.light") : t("theme.dark")}
    >
      {isDark ? <SunIcon className={sm ? "h-3.5 w-3.5" : "h-4 w-4"} /> : <MoonIcon className={sm ? "h-3.5 w-3.5" : "h-4 w-4"} />}
    </button>
  );
}
