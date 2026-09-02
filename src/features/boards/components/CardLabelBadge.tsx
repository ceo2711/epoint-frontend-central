"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineTag } from "react-icons/hi2";

import { useTranslation } from "@/contexts/LanguageContext";
import {
  BOARD_CARD_LABELS,
  cardLabelBadgeClass,
  cardLabelSwatchClass,
  isBoardCardLabel,
  resolveCardLabel,
  type BoardCardLabel,
} from "@/features/boards/constants/cardLabels";

const MENU_MIN_WIDTH = 176;
const MENU_ESTIMATED_HEIGHT = 220;
const VIEWPORT_PAD = 8;

export function CardLabelBadge({ label }: { label: string | null | undefined }) {
  const { t } = useTranslation();
  if (!isBoardCardLabel(label)) return null;
  const resolved = label;

  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${cardLabelBadgeClass(resolved)}`}
    >
      {t(`portalBoard.cardLabels.${resolved}` as never)}
    </span>
  );
}

type MenuCoords = { top: number; left: number };

function computeMenuCoords(anchor: DOMRect): MenuCoords {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = anchor.left;
  if (left + MENU_MIN_WIDTH > vw - VIEWPORT_PAD) {
    left = Math.max(VIEWPORT_PAD, anchor.right - MENU_MIN_WIDTH);
  }
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;

  let top = anchor.bottom + 6;
  if (top + MENU_ESTIMATED_HEIGHT > vh - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, anchor.top - MENU_ESTIMATED_HEIGHT - 6);
  }

  return { top, left };
}

export function CardLabelPicker({
  value,
  onChange,
  disabled,
  compact = false,
}: {
  value: string | null | undefined;
  onChange: (label: BoardCardLabel) => void;
  disabled?: boolean;
  /** Icono pequeño para la card del kanban. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = resolveCardLabel(value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) return;
      setCoords(computeMenuCoords(triggerRef.current.getBoundingClientRect()));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const menu =
    open && coords && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="listbox"
            aria-label={t("portalBoard.cardLabel")}
            className="fixed z-80 min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            style={{ top: coords.top, left: coords.left }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("portalBoard.cardLabelPick")}
            </p>
            {BOARD_CARD_LABELS.map((label) => {
              const selected = label === current;
              return (
                <button
                  key={label}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    selected ? "bg-slate-50 font-semibold text-slate-900" : "text-slate-700"
                  }`}
                  onClick={() => {
                    onChange(label);
                    setOpen(false);
                  }}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${cardLabelSwatchClass(label)}`} aria-hidden />
                  <span className="flex-1">{t(`portalBoard.cardLabels.${label}` as never)}</span>
                  {selected ? <span className="text-xs text-slate-400">✓</span> : null}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={compact ? "inline-flex" : "block"}>
      {compact ? (
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-600 transition hover:bg-black/10 hover:text-slate-900 disabled:opacity-50"
          aria-label={t("portalBoard.cardLabel")}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={menuId}
          title={t("portalBoard.cardLabel")}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            setOpen((prev) => !prev);
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <HiOutlineTag className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white/70 px-2.5 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-50"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={menuId}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
        >
          <HiOutlineTag className="h-4 w-4 shrink-0" aria-hidden />
          <span
            className={`h-2.5 w-2.5 rounded-full ${cardLabelSwatchClass(current)}`}
            aria-hidden
          />
          <span>{t(`portalBoard.cardLabels.${current}` as never)}</span>
        </button>
      )}
      {menu}
    </div>
  );
}

/** @deprecated Prefer CardLabelPicker — kept for simple read-only display helpers. */
export function CardLabelSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null | undefined;
  onChange: (label: BoardCardLabel | null) => void;
  disabled?: boolean;
}) {
  return (
    <CardLabelPicker
      value={value}
      disabled={disabled}
      onChange={(label) => onChange(isBoardCardLabel(label) ? label : null)}
    />
  );
}
