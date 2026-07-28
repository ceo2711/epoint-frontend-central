"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Sidebar } from "@/components/layout/Sidebar";
import { AppDataPrefetcher } from "@/components/providers/AppDataPrefetcher";
import { MandatoryTwoFactorModal } from "@/features/auth/components/MandatoryTwoFactorModal";
import { consumeAuthEnterTransition } from "@/features/auth/auth-enter-transition";
import { LazyFloatingChatWidget } from "@/lib/lazyPanels";
import { NotificationsProvider } from "@/features/notifications/NotificationsContext";
import { useShell } from "@/contexts/ShellContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { mobileOpen, closeMobile } = useShell();
  const { t } = useTranslation();
  const { user } = useAuth();
  const showStaffNotifications = user?.role.code !== "CLIENT";
  const showChatWidgetForRole = Boolean(user);
  const [mounted, setMounted] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [enterFromAuth, setEnterFromAuth] = useState(false);
  const [enterVisible, setEnterVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);

    const shouldAnimate = consumeAuthEnterTransition();
    if (!shouldAnimate || mq.matches) {
      setEnterFromAuth(false);
      setEnterVisible(true);
      return;
    }

    setEnterFromAuth(true);
    setEnterVisible(false);
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEnterVisible(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!showChatWidgetForRole) {
      setShowChatWidget(false);
      return;
    }
    const timer = window.setTimeout(() => setShowChatWidget(true), 5_000);
    return () => window.clearTimeout(timer);
  }, [showChatWidgetForRole]);

  return (
    <NotificationsProvider enabled={showStaffNotifications}>
      <AppDataPrefetcher />
      <div
        className={[
          "app-shell-bg fixed inset-0 z-0 flex min-h-0 overflow-hidden",
          enterFromAuth && !reduceMotion
            ? "transition-[opacity,transform] duration-700 ease-out"
            : "",
          enterVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.99] opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          className={`fixed inset-0 z-40 bg-brown-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden ${
            mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-label={t("common.closeMenu")}
          aria-hidden={!mobileOpen}
          tabIndex={mobileOpen ? 0 : -1}
          onClick={closeMobile}
        />
        <Sidebar />
        <main className="relative flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
          {children}
        </main>
      </div>
      {mounted && showChatWidgetForRole && showChatWidget
        ? createPortal(<LazyFloatingChatWidget />, document.body)
        : null}
      {mounted ? <MandatoryTwoFactorModal /> : null}
    </NotificationsProvider>
  );
}
