"use client";

import { type ReactNode, useEffect } from "react";

import { ModalPortal } from "@/components/ui/ModalPortal";
import { registerModalOverlay } from "@/lib/modalOverlay";
import { useTranslation } from "@/contexts/LanguageContext";

export type ModalSize = "md" | "lg" | "xl";

export interface ModalCloseButtonProps {
  onClick: () => void;
  className?: string;
}

export function ModalCloseButton({ onClick, className = "" }: ModalCloseButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`modal-close-btn ${className}`.trim()}
      onClick={onClick}
      aria-label={t("common.close")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

export interface ModalProps {
  title: ReactNode;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  dismissible?: boolean;
  usePortal?: boolean;
  className?: string;
}

const sizeClass: Record<ModalSize, string> = {
  md: "",
  lg: "modal-panel-lg",
  xl: "modal-panel-xl",
};

export function Modal({
  title,
  subtitle,
  headerActions,
  onClose,
  children,
  footer,
  size = "md",
  dismissible = true,
  usePortal = true,
  className = "",
}: ModalProps) {
  const canDismiss = dismissible && !!onClose;

  useEffect(() => {
    if (!canDismiss || !onClose) return;

    const handleClose = onClose;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canDismiss, onClose]);

  useEffect(() => registerModalOverlay(), []);

  const panel = (
    <div
      className={`modal-panel ${sizeClass[size]} ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <div className="min-w-0 flex-1">
          <h2 className="modal-title">{title}</h2>
          {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {headerActions}
          {canDismiss ? <ModalCloseButton onClick={onClose} /> : null}
        </div>
      </div>
      <div className="modal-body">{children}</div>
      {footer ? <div className="modal-footer">{footer}</div> : null}
    </div>
  );

  const overlay = (
    <div className="modal-overlay" onClick={canDismiss ? onClose : undefined}>
      {panel}
    </div>
  );

  if (usePortal) {
    return <ModalPortal>{overlay}</ModalPortal>;
  }

  return overlay;
}
