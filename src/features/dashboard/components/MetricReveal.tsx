"use client";

import type { CSSProperties, ReactNode } from "react";

export function MetricReveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  return (
    <div
      className={`metric-reveal ${className}`.trim()}
      style={{ "--metric-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
