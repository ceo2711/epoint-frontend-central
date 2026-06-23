import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...props }, ref) => (
    <div>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
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
