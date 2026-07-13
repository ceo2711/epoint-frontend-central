"use client";

import { ReactNode } from "react";

import { MerchantSwitchOverlay } from "@/components/layout/MerchantSwitchOverlay";

export function PageContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex-1 min-w-0 w-full max-w-full overflow-x-hidden px-4 py-4 pb-20 sm:p-6 sm:pb-20 lg:p-8 lg:pb-24 ${className}`}
    >
      {children}
      <MerchantSwitchOverlay />
    </div>
  );
}
