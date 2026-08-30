"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { translateRole } from "@/i18n";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const accountHref = user?.role.code === "CLIENT" ? "/portal/cuenta" : "/configuracion";

  useEffect(() => {
    if (open) {
      setRendered(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }

    setEntered(false);
    const timeout = window.setTimeout(() => setRendered(false), 150);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-sm transition hover:border-brand/30 hover:bg-cream-50"
        aria-label={t("header.userMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          avatarUrl={user.avatar_url}
          size="sm"
        />
        <ChevronDown open={open} />
      </button>

      {rendered ? (
        <div
          role="menu"
          className={`absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl ring-1 ring-black/5 transition-[opacity,transform] duration-150 ease-out ${
            entered
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-95 opacity-0"
          }`}
        >
          <div className="rounded-xl bg-cream-100/80 px-3 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {translateRole(locale, user.role.code, user.role.name)}
            </p>
          </div>

          <div className="mt-1 space-y-0.5">
            <Link
              href={accountHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-cream-100 hover:text-slate-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-4 w-4 shrink-0 text-slate-400"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {t("nav.account")}
            </Link>

            <div className="px-2 py-1.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {t("language.label")}
              </p>
              <div className="flex items-center gap-2">
                <LanguageSwitcher
                  compact
                  size="sm"
                  className="w-fit border-slate-200 bg-slate-50"
                />
                <ThemeToggle size="sm" />
              </div>
            </div>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-4 w-4 shrink-0"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t("common.logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

