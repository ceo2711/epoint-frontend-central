"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoginHero } from "@/features/auth/components/LoginHero";
import { TwoFactorLoginForm } from "@/features/auth/components/TwoFactorLoginForm";
import { DesertBackground } from "@/features/auth/components/DesertBackground";
import { useAuth } from "@/features/auth/AuthContext";
import {
  getDefaultAppPath,
  mustForcePasswordChange,
} from "@/features/auth/auth-redirect";
import { markAuthEnterTransition } from "@/features/auth/auth-enter-transition";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";

type LoginStep = "credentials" | "twoFactor";

const FADE_MS = 420;
const EXIT_MS = 650;

export default function LoginPage() {
  const router = useRouter();
  const { login, completeTwoFactorLogin, cancelTwoFactorLogin, user, isLoading } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [pendingUserName, setPendingUserName] = useState<string | undefined>();
  /** Textos del login / marketing desvanecidos; el panel ya se desliza. */
  const [fadingOut, setFadingOut] = useState(false);
  /** Contenido 2FA visible (después del fade del login). */
  const [showTwoFactorContent, setShowTwoFactorContent] = useState(false);
  /** Salida animada hacia el panel de la app. */
  const [exitingToApp, setExitingToApp] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timersRef = useRef<number[]>([]);
  const exitStartedRef = useRef(false);

  function clearTimers() {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (isLoading || !user || exitStartedRef.current) return;

    exitStartedRef.current = true;
    clearTimers();
    setFadingOut(true);
    setExitingToApp(true);

    const forcePassword = mustForcePasswordChange(user);
    const target = forcePassword
      ? "/cambiar-contrasena"
      : getDefaultAppPath(user.role.code);

    if (!forcePassword) {
      markAuthEnterTransition();
    }

    const delay = reduceMotion ? 0 : EXIT_MS;
    timersRef.current.push(
      window.setTimeout(() => {
        router.replace(target);
      }, delay),
    );
  }, [user, isLoading, router, reduceMotion]);

  function goToTwoFactor(userName?: string) {
    clearTimers();
    setPendingUserName(userName);
    setFadingOut(true);
    setStep("twoFactor");

    const delay = reduceMotion ? 0 : FADE_MS;
    timersRef.current.push(
      window.setTimeout(() => {
        setShowTwoFactorContent(true);
        setFadingOut(false);
      }, delay),
    );
  }

  function handleBackToCredentials() {
    if (exitingToApp) return;
    clearTimers();
    cancelTwoFactorLogin();
    setShowTwoFactorContent(false);
    setFadingOut(true);

    const delay = reduceMotion ? 0 : FADE_MS;
    timersRef.current.push(
      window.setTimeout(() => {
        setPendingUserName(undefined);
        setStep("credentials");
        setFadingOut(false);
      }, delay),
    );
  }

  const isTwoFactorLayout = step === "twoFactor";

  if (isLoading) {
    return (
      <div className="login-bg relative flex min-h-dvh h-dvh items-center justify-center">
        <DesertBackground />
        <div className="relative z-10">
          <LoadingSpinner label={t("login.verifyingSession")} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "login-bg relative flex min-h-dvh h-dvh min-w-0 overflow-x-hidden",
        reduceMotion ? "" : "transition-[opacity,transform,filter] duration-700 ease-out",
        exitingToApp
          ? "pointer-events-none scale-[0.985] opacity-0 blur-[2px]"
          : "scale-100 opacity-100 blur-0",
      ].join(" ")}
    >
      <DesertBackground />

      <LoginHero
        className={[
          "p-12 xl:p-16",
          reduceMotion
            ? ""
            : "transition-[width,min-width,max-width,opacity,padding] duration-700 ease-out",
          isTwoFactorLayout || exitingToApp
            ? "w-0 min-w-0 max-w-0 p-0 opacity-0"
            : "w-0 opacity-100 lg:w-1/2 lg:min-w-[50%] lg:max-w-[50%]",
        ].join(" ")}
        marketingClassName={
          fadingOut || isTwoFactorLayout || exitingToApp ? "opacity-0" : "opacity-100"
        }
      />

      <LoginHero
        brandOnly
        brandClassName={[
          reduceMotion ? "" : "transition-opacity duration-500 ease-out",
          isTwoFactorLayout && showTwoFactorContent && !exitingToApp
            ? "opacity-100 delay-150"
            : "opacity-0",
        ].join(" ")}
      />

      <div className="relative z-10 flex min-w-0 flex-1 items-center justify-center overflow-x-hidden p-4 sm:p-6 lg:p-12">
        <div
          className={[
            "relative w-full max-w-md",
            reduceMotion ? "" : "transition-all duration-700 ease-out",
            exitingToApp ? "translate-y-4 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100",
          ].join(" ")}
        >
          <div
            className={[
              reduceMotion ? "" : "transition-all duration-500 ease-out",
              showTwoFactorContent
                ? "pointer-events-none absolute inset-x-0 top-0 -translate-x-6 scale-[0.98] opacity-0"
                : "relative translate-x-0 scale-100 opacity-100",
            ].join(" ")}
            aria-hidden={showTwoFactorContent}
          >
            <LoginForm
              embedded
              contentClassName={
                (fadingOut && isTwoFactorLayout) || exitingToApp
                  ? "opacity-0"
                  : "opacity-100"
              }
              onSubmit={async (email, password) => {
                if (exitingToApp) return;
                const result = await login(email, password);
                if (result.requiresTwoFactor) {
                  goToTwoFactor(result.userName);
                }
              }}
            />
          </div>

          <div
            className={[
              reduceMotion ? "" : "transition-all duration-500 ease-out",
              showTwoFactorContent
                ? "relative translate-x-0 scale-100 opacity-100"
                : "pointer-events-none absolute inset-x-0 top-0 translate-x-6 scale-[0.98] opacity-0",
            ].join(" ")}
            aria-hidden={!showTwoFactorContent}
          >
            <TwoFactorLoginForm
              embedded
              userName={pendingUserName}
              contentClassName={
                showTwoFactorContent && !exitingToApp ? "opacity-100" : "opacity-0"
              }
              onSubmit={async (code) => {
                if (exitingToApp) return;
                await completeTwoFactorLogin(code);
              }}
              onBack={handleBackToCredentials}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
