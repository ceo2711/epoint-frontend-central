"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { AppLogo } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/Button";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useTranslation } from "@/contexts/LanguageContext";
import { useShell } from "@/contexts/ShellContext";
import { useAuth } from "@/features/auth/AuthContext";
import { shouldShowFirstSteps } from "@/features/auth/auth-redirect";
import {
  inflateRect,
  PORTAL_TOUR_STEPS,
  portalTourSelector,
  type InflatedRect,
} from "@/features/portal/firstStepsTour";
import { PortalTourContext } from "@/features/portal/portalTourContext";
import { api } from "@/lib/api";
import { registerModalOverlay } from "@/lib/modalOverlay";

const HIGHLIGHT_PADDING = 10;
const SIDEBAR_ANIMATION_MS = 320;

const STEP_ICONS: Record<string, string> = {
  welcome:
    "M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z",
  portal:
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  datos:
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  documentos:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  tablero:
    "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
};

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return desktop;
}

function TourStepIcon({ stepId }: { stepId: string }) {
  const d = STEP_ICONS[stepId] ?? STEP_ICONS.welcome;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function TourArrow() {
  return (
    <svg
      className="pointer-events-none absolute -left-[14px] top-11 hidden drop-shadow-sm lg:block"
      width="16"
      height="28"
      viewBox="0 0 16 28"
      aria-hidden
    >
      <path d="M15 2 2 14l13 12" className="portal-tour-arrow" strokeWidth="1" />
    </svg>
  );
}

function FirstStepsTour({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { token, refreshUser } = useAuth();
  const { openMobile, closeMobile, expandSidebar } = useShell();
  const isDesktop = useIsDesktop();
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hole, setHole] = useState<InflatedRect | null>(null);

  const step = PORTAL_TOUR_STEPS[index];
  const isLast = index === PORTAL_TOUR_STEPS.length - 1;
  const isFirst = index === 0;
  const isWelcome = step.id === "welcome";

  const measure = useCallback(() => {
    if (!step.target) {
      setHole(null);
      return;
    }
    const el = document.querySelector(portalTourSelector(step.target));
    if (!el) {
      setHole(null);
      return;
    }
    setHole(inflateRect(el.getBoundingClientRect(), HIGHLIGHT_PADDING));
  }, [step.target]);

  useEffect(() => registerModalOverlay(), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    expandSidebar();
    if (step.target) openMobile();
    else closeMobile();
  }, [closeMobile, expandSidebar, openMobile, step.target]);

  useLayoutEffect(() => {
    const delay = step.target ? SIDEBAR_ANIMATION_MS : 0;
    const timer = window.setTimeout(measure, delay);
    return () => window.clearTimeout(timer);
  }, [index, measure, step.target]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  async function completeTour() {
    if (!token || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/auth/me/first-steps/complete", {}, token);
      closeMobile();
      onClose();
      await refreshUser();
    } catch {
      setError(t("portalFirstSteps.saveError"));
    } finally {
      setSaving(false);
    }
  }

  const cardStyle =
    hole && isDesktop
      ? {
          top: Math.min(Math.max(20, hole.top - 8), window.innerHeight - 340),
          left: Math.min(hole.left + hole.width + 22, window.innerWidth - 400),
        }
      : undefined;

  const holeStyle = hole
    ? { top: hole.top, left: hole.left, width: hole.width, height: hole.height }
    : undefined;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[90] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-tour-title"
        aria-describedby="portal-tour-body"
      >
        {hole ? (
          <>
            <div className="portal-tour-dim transition-[top,left,width,height] duration-300 ease-out" style={holeStyle} />
            <div className="portal-tour-ring transition-[top,left,width,height] duration-300 ease-out" style={holeStyle} />
          </>
        ) : (
          <div className="absolute inset-0 bg-[rgba(26,16,8,0.58)]" />
        )}

        <div
          className={`portal-tour-card pointer-events-auto absolute z-[91] overflow-hidden rounded-[1.35rem] ${
            hole && !isDesktop
              ? "bottom-4 left-4 right-4 w-auto"
              : hole
                ? "w-[min(23.5rem,calc(100vw-2rem))]"
                : "left-1/2 top-1/2 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2"
          }`}
          style={cardStyle}
        >
          {hole && isDesktop ? <TourArrow /> : null}
          <div className="portal-tour-accent" />
          <div key={step.id} className="portal-tour-card-body px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {isWelcome ? <AppLogo size="sm" className="shadow-md" /> : null}
                <p className="portal-tour-kicker truncate text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {t("portalFirstSteps.title")}
                </p>
              </div>
              <span className="portal-tour-step-pill shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                {t("portalFirstSteps.stepOf", {
                  current: index + 1,
                  total: PORTAL_TOUR_STEPS.length,
                })}
              </span>
            </div>

            <div className={`${isWelcome ? "mt-5 flex flex-col items-center text-center" : "mt-4"}`}>
              <div
                className={`portal-tour-icon flex items-center justify-center rounded-2xl ring-1 ring-black/5 ${
                  isWelcome ? "h-16 w-16" : "h-12 w-12"
                }`}
              >
                <TourStepIcon stepId={step.id} />
              </div>
              <h2
                id="portal-tour-title"
                className={`portal-tour-title font-bold tracking-tight ${
                  isWelcome ? "mt-4 text-2xl" : "mt-3 text-lg"
                }`}
              >
                {t(step.titleKey)}
              </h2>
              <p
                id="portal-tour-body"
                className={`portal-tour-copy max-w-prose leading-relaxed ${
                  isWelcome ? "mt-2.5 text-[15px]" : "mt-2 text-sm"
                }`}
              >
                {t(step.bodyKey)}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden>
              {PORTAL_TOUR_STEPS.map((item, stepIndex) => (
                <span
                  key={item.id}
                  className={`portal-tour-dot ${
                    stepIndex === index ? "is-active" : stepIndex < index ? "is-done" : ""
                  }`}
                />
              ))}
            </div>

            {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className="portal-tour-skip px-1 py-1 text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50"
                disabled={saving}
                onClick={() => void completeTour()}
              >
                {t("portalFirstSteps.skip")}
              </button>
              <div className="flex items-center gap-1.5">
                {!isFirst ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setError(null);
                      setIndex((value) => value - 1);
                    }}
                  >
                    {t("common.previous")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => {
                    if (isLast) {
                      void completeTour();
                      return;
                    }
                    setError(null);
                    setIndex((value) => value + 1);
                  }}
                >
                  {saving && isLast
                    ? t("common.loading")
                    : isLast
                      ? t("portalFirstSteps.finish")
                      : t("portalFirstSteps.nextStep")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function FirstStepsGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const autoShow = shouldShowFirstSteps(user);
  const [replay, setReplay] = useState(false);
  const show = autoShow || replay;

  const startTour = useCallback(() => setReplay(true), []);
  const stopTour = useCallback(() => setReplay(false), []);

  return (
    <PortalTourContext.Provider value={{ active: show, startTour }}>
      {children}
      {show ? <FirstStepsTour onClose={stopTour} /> : null}
    </PortalTourContext.Provider>
  );
}
