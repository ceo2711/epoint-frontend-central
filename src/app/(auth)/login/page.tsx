"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoginHero } from "@/features/auth/components/LoginHero";
import { NightSkyBackground } from "@/features/auth/components/NightSkyBackground";
import { useAuth } from "@/features/auth/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role.code === "CLIENT" ? "/portal" : "/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="login-bg relative flex min-h-screen items-center justify-center">
        <NightSkyBackground />
        <div className="relative z-10">
          <LoadingSpinner label={t("login.verifyingSession")} />
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg relative flex min-h-screen">
      <NightSkyBackground />
      <LoginHero />
      <LoginForm onSubmit={login} />
    </div>
  );
}
