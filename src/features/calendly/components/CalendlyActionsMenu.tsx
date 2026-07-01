"use client";

import { useEffect, useRef, useState } from "react";
import { VscSettingsCompact } from "react-icons/vsc";

import { useTranslation } from "@/contexts/LanguageContext";

interface CalendlyActionsMenuProps {
  canCreateEvent: boolean;
  canOpenSettings: boolean;
  syncing: boolean;
  loading: boolean;
  onCreateEvent: () => void;
  onSync: () => void;
  onOpenSettings: () => void;
  align?: "left" | "right";
}

export function CalendlyActionsMenu({
  canCreateEvent,
  canOpenSettings,
  syncing,
  loading,
  onCreateEvent,
  onSync,
  onOpenSettings,
  align = "left",
}: CalendlyActionsMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function closeAndRun(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`calendly-calendar-actions-trigger${open ? " calendly-calendar-actions-trigger--open" : ""}`}
        aria-label={t("calendly.actionsMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <VscSettingsCompact className="h-[1.25rem] w-[1.25rem]" aria-hidden />
      </button>

      {open && (
        <div
          className={`action-menu-dropdown ${align === "right" ? "action-menu-dropdown-right" : ""}`}
          role="menu"
        >
          {canCreateEvent && (
            <button
              type="button"
              role="menuitem"
              className="action-menu-item action-menu-item-primary"
              onClick={() => closeAndRun(onCreateEvent)}
            >
              {t("calendly.newEvent")}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="action-menu-item"
            disabled={syncing || loading}
            onClick={() => closeAndRun(onSync)}
          >
            {syncing ? t("calendly.syncing") : t("calendly.sync")}
          </button>
          {canOpenSettings && (
            <button
              type="button"
              role="menuitem"
              className="action-menu-item"
              onClick={() => closeAndRun(onOpenSettings)}
            >
              {t("calendly.settingsTitle")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
