"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { useTranslation } from "@/contexts/LanguageContext";

export function FieldHelp({ text }: { text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className={`tooltip-wrap tooltip-wrap--help ${open ? "is-open" : ""}`}
    >
      <button
        type="button"
        className="field-help-btn"
        aria-label={t("common.fieldHelp")}
        aria-expanded={open}
        aria-describedby={tooltipId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        ?
      </button>
      <span id={tooltipId} role="tooltip" className="tooltip-bubble tooltip-bubble--help">
        {text}
      </span>
    </span>
  );
}

export function FieldLabel({
  htmlFor,
  help,
  children,
}: {
  htmlFor?: string;
  help?: string;
  children: ReactNode;
}) {
  const content = (
    <span className="inline-flex items-center gap-1">
      <span>{children}</span>
      {help ? <FieldHelp text={help} /> : null}
    </span>
  );

  if (!htmlFor) {
    return <span className="input-label">{content}</span>;
  }

  return (
    <label htmlFor={htmlFor} className="input-label">
      {content}
    </label>
  );
}
