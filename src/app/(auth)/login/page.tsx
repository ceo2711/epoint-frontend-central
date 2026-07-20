"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoginHero } from "@/features/auth/components/LoginHero";
import { TwoFactorLoginForm } from "@/features/auth/components/TwoFactorLoginForm";
import { DesertBackground } from "@/features/auth/components/DesertBackground";
import { useAuth } from "@/features/auth/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";

type LoginStep = "credentials" | "twoFactor";

export default function LoginPage() {
  const router = useRouter();
  const { login, completeTwoFactorLogin, cancelTwoFactorLogin, user, isLoading } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [pendingUserName, setPendingUserName] = useState<string | undefined>();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role.code === "CLIENT" ? "/portal" : "/dashboard");
    }
  }, [user, isLoading, router]);

  function handleBackToCredentials() {
    cancelTwoFactorLogin();
    setPendingUserName(undefined);
    setStep("credentials");
  }

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

  if (step === "twoFactor") {
    return (
      <div className="login-bg relative flex min-h-dvh h-dvh">
        <DesertBackground />
        <TwoFactorLoginForm
          userName={pendingUserName}
          onSubmit={completeTwoFactorLogin}
          onBack={handleBackToCredentials}
        />
      </div>
    );
  }

  return (
    <div className="login-bg relative flex min-h-dvh h-dvh min-w-0 overflow-x-hidden">
      <DesertBackground />
      <LoginHero />
      <LoginForm
        onSubmit={async (email, password) => {
          const result = await login(email, password);
          if (result.requiresTwoFactor) {
            setPendingUserName(result.userName);
            setStep("twoFactor");
          }
        }}
      />
    </div>
  );
}
