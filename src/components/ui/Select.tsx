"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

import { FieldLabel } from "@/components/ui/FieldHelp";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  help?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, help, className = "", id, children, ...props }, ref) => (
    <div>
      {label && (
        <FieldLabel htmlFor={id} help={help}>
          {label}
        </FieldLabel>
      )}
      <select
        ref={ref}
        id={id}
        className={`input-field ${error ? "border-red-300 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  ),
);

Select.displayName = "Select";
