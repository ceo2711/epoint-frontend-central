"use client";

import { AppLogo } from "@/components/layout/AppLogo";
import { useTranslation } from "@/contexts/LanguageContext";

type LoginHeroProps = {
  /** Solo logo + nombre (p. ej. pantalla 2FA). */
  brandOnly?: boolean;
  /** Panel completo colapsando / visible. */
  className?: string;
  /** Opacidad del copy de marketing (headline, features). */
  marketingClassName?: string;
  /** Opacidad del bloque brandOnly absoluto. */
  brandClassName?: string;
};

export function LoginHero({
  brandOnly = false,
  className = "",
  marketingClassName = "",
  brandClassName = "",
}: LoginHeroProps) {
  const { t } = useTranslation();
  const features = [t("login.feature1"), t("login.feature2"), t("login.feature3")];

  if (brandOnly) {
    return (
      <div
        className={`pointer-events-none absolute left-8 top-8 z-20 hidden items-center gap-5 lg:flex xl:left-12 xl:top-12 ${brandClassName}`.trim()}
      >
        <AppLogo size="2xl" priority className="rounded-2xl shadow-md" />
        <p className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
          Epoint
          <br />
          Corporation
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative z-10 hidden flex-col justify-between overflow-hidden text-white lg:flex ${className}`.trim()}
    >
      <div className="relative z-10 shrink-0">
        <div className="flex items-center gap-5">
          <AppLogo size="2xl" priority className="rounded-2xl shadow-md" />
          <div className="min-w-0">
            <p className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              Epoint
              <br />
              Corporation
            </p>
          </div>
        </div>
      </div>

      <div
        className={`relative z-10 max-w-md transition-opacity duration-500 ease-out ${marketingClassName}`.trim()}
      >
        <h2 className="text-3xl font-bold leading-tight xl:text-4xl">{t("login.headline")}</h2>
        <p className="mt-4 text-base leading-relaxed text-cream-700/90">{t("login.subheadline")}</p>
        <ul className="mt-8 space-y-3">
          {features.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-cream-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/30 ring-1 ring-accent/40">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p
        className={`relative z-10 shrink-0 text-xs text-cream-700 transition-opacity duration-500 ease-out ${marketingClassName}`.trim()}
      >
        © 2026 Epoint Corporation
      </p>
    </div>
  );
}
