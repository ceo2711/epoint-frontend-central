"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Tooltip } from "@/components/ui/Tooltip";

type Variant = "default" | "primary" | "danger" | "ghost";

interface IconActionBaseProps {
  label: string;
  icon: ReactNode;
  variant?: Variant;
  className?: string;
}

interface IconActionButtonProps
  extends IconActionBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> {
  href?: undefined;
}

interface IconActionLinkProps extends IconActionBaseProps {
  href: string;
  disabled?: boolean;
}

const variantClass: Record<Variant, string> = {
  default: "icon-action-default",
  primary: "icon-action-primary",
  danger: "icon-action-danger",
  ghost: "icon-action-ghost",
};

function buildClassName(variant: Variant, disabled: boolean | undefined, className: string) {
  return [
    "icon-action-btn",
    variantClass[variant],
    disabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function IconActionButton({
  label,
  icon,
  variant = "default",
  className = "",
  disabled,
  href,
  ...buttonProps
}: IconActionButtonProps | IconActionLinkProps) {
  if (href) {
    const linkClassName = buildClassName(variant, disabled, className);
    const link = disabled ? (
      <span className={linkClassName} aria-disabled="true" aria-label={label}>
        {icon}
      </span>
    ) : (
      <Link href={href} className={linkClassName} aria-label={label}>
        {icon}
      </Link>
    );

    return <Tooltip label={label}>{link}</Tooltip>;
  }

  return (
    <Tooltip label={label}>
      <button
        type="button"
        className={buildClassName(variant, disabled, className)}
        aria-label={label}
        disabled={disabled}
        {...buttonProps}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

export function TableActions({ children }: { children: ReactNode }) {
  return <div className="table-actions">{children}</div>;
}
