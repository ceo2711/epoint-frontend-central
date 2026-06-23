"use client";

import { useTranslation } from "@/contexts/LanguageContext";

export function LoginHero() {
  const { t } = useTranslation();
  const features = [t("login.feature1"), t("login.feature2"), t("login.feature3")];

  return (
    <div className="relative z-10 hidden flex-col justify-between p-12 text-white lg:flex lg:w-1/2 xl:p-16">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <span className="text-lg font-bold">eP</span>
          </div>
          <span className="text-xl font-bold">ePoint Central</span>
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <h2 className="text-3xl font-bold leading-tight xl:text-4xl">{t("login.headline")}</h2>
        <p className="mt-4 text-base leading-relaxed text-blue-100/80">{t("login.subheadline")}</p>
        <ul className="mt-8 space-y-3">
          {features.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/30 ring-1 ring-blue-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-slate-400">© 2026 ePoint Central</p>
    </div>
  );
}
