"use client";

import { AuthProvider } from "@/features/auth/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ModalProvider>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </ModalProvider>
    </LanguageProvider>
  );
}
