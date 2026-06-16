"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import type { DocumentBrief, LocalizedStringList } from "@/types/api";
import type { Locale } from "@/i18n";

export function pickLocalizedMessages(
  messages: LocalizedStringList | null | undefined,
  locale: Locale,
): string[] {
  if (!messages) return [];
  return locale === "es" ? messages.es : messages.en;
}

interface DocumentVerificationTooltipProps {
  doc: DocumentBrief;
  locale: Locale;
  rejectionTitle: string;
  approvalTitle: string;
  viewLabel: string;
}

type Placement = "top" | "bottom";

export function DocumentVerificationTooltip({
  doc,
  locale,
  rejectionTitle,
  approvalTitle,
  viewLabel,
}: DocumentVerificationTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [placement, setPlacement] = useState<Placement>("bottom");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const rejectionMessages = pickLocalizedMessages(doc.rejection_reasons, locale);
  const approvalMessages = pickLocalizedMessages(doc.approval_reasons, locale);

  const isRejected = doc.verification_status === "RECHAZADO";
  const isApproved =
    doc.verification_status === "APROBADO" || doc.verification_status === "PROXIMO_A_VENCER";

  const messages = isRejected ? rejectionMessages : isApproved ? approvalMessages : [];
  const title = isRejected ? rejectionTitle : approvalTitle;
  const tone = isRejected ? "red" : "green";

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const hide = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
    setPinned(false);
  }, [clearCloseTimer]);

  const scheduleHide = useCallback(() => {
    if (pinned) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  }, [clearCloseTimer, pinned]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current || !panelRef.current) return;

    const triggerRect = rootRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current.offsetHeight;
    const margin = 12;
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;

    if (spaceBelow >= panelHeight + margin) {
      setPlacement("bottom");
    } else if (spaceAbove >= panelHeight + margin) {
      setPlacement("top");
    } else {
      setPlacement(spaceBelow >= spaceAbove ? "bottom" : "top");
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        hide();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [hide, open]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  if (!messages.length) return null;

  const toneStyles =
    tone === "red"
      ? {
          button: "text-red-600 hover:bg-red-50 focus-visible:ring-red-200",
          panel: "border-red-200 bg-white",
          title: "text-red-800",
          item: "text-red-700",
        }
      : {
          button: "text-emerald-600 hover:bg-emerald-50 focus-visible:ring-emerald-200",
          panel: "border-emerald-200 bg-white",
          title: "text-emerald-800",
          item: "text-emerald-700",
        };

  const placementStyles =
    placement === "top"
      ? "bottom-full pb-2"
      : "top-full pt-2";

  return (
    <div
      ref={rootRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      <button
        type="button"
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 ${toneStyles.button}`}
        aria-label={viewLabel}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => {
          if (pinned) {
            hide();
            return;
          }
          show();
          setPinned(true);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute left-1/2 z-50 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 ${placementStyles}`}
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
        >
          <div
            id={tooltipId}
            ref={panelRef}
            role="tooltip"
            className={`rounded-xl border p-3 shadow-lg ${toneStyles.panel}`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${toneStyles.title}`}>{title}</p>
            <ul className={`mt-2 max-h-48 space-y-1.5 overflow-y-auto text-sm leading-relaxed ${toneStyles.item}`}>
              {messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
