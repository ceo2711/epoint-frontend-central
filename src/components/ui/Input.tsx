"use client";

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from "react";

import { FieldLabel } from "@/components/ui/FieldHelp";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  help?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, help, className = "", id, ...props }, ref) => (
    <div>
      {label && (
        <FieldLabel htmlFor={id} help={help}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={`input-field ${icon ? "input-with-icon" : ""} ${error ? "border-red-300 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";

interface PasswordInputProps extends Omit<InputProps, "type"> {
  show?: boolean;
  onToggle?: () => void;
  showLabel?: string;
  hideLabel?: string;
  error?: string;
}

export function PasswordInput({
  show: showProp,
  onToggle,
  label,
  help,
  id = "password",
  showLabel = "Show password",
  hideLabel = "Hide password",
  error,
  className = "",
  ...props
}: PasswordInputProps) {
  const [internalShow, setInternalShow] = useState(false);
  const show = showProp ?? internalShow;
  const toggle = onToggle ?? (() => setInternalShow((v) => !v));

  return (
    <div>
      {label && (
        <FieldLabel htmlFor={id} help={help}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`input-field pr-11 ${error ? "border-red-300 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" : ""} ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={show ? hideLabel : showLabel}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 8 10 8a18.36 18.36 0 0 1-2.16 3.19" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s4 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="2" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function EmailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
}
