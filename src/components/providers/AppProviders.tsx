"use client";

import { AuthProvider } from "@/features/auth/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { NotificationsProvider } from "@/features/notifications/NotificationsContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ModalProvider>
        <AuthProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </AuthProvider>
      </ModalProvider>
    </LanguageProvider>
  );
}
