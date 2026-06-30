"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/contexts/LanguageContext";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  return <ResetPasswordForm token={token} />;
}

export default function ConfirmarRecuperarContrasenaPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="login-bg flex min-h-screen items-center justify-center">
          <LoadingSpinner label={t("common.loading")} />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
