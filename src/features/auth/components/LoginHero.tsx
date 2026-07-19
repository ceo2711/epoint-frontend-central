"use client";

import { AppLogo } from "@/components/layout/AppLogo";
import { useTranslation } from "@/contexts/LanguageContext";

export function LoginHero() {
  const { t } = useTranslation();
  const features = [t("login.feature1"), t("login.feature2"), t("login.feature3")];

  return (
    <div className="relative z-10 hidden flex-col justify-between p-12 text-white lg:flex lg:w-1/2 xl:p-16">
      <div className="relative z-10">
        <div className="flex items-center gap-5">
          <AppLogo size="2xl" priority className="rounded-2xl shadow-md" />
          <div className="min-w-0">
            <p className="text-3xl font-bold tracking-tight text-white xl:text-4xl">Epoint Central</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-md">
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

      <p className="relative z-10 text-xs text-cream-700">© 2026 Epoint Central</p>
    </div>
  );
}
