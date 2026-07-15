"use client";

import { AuthProvider } from "@/features/auth/AuthContext";
import { MerchantProvider } from "@/contexts/MerchantContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ModalProvider>
        <QueryProvider>
          <AuthProvider>
            <MerchantProvider>{children}</MerchantProvider>
          </AuthProvider>
        </QueryProvider>
      </ModalProvider>
    </LanguageProvider>
  );
}
