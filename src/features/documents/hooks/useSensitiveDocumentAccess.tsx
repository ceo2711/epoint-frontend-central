"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthContext";
import { SensitiveDocumentUnlockModal } from "@/features/documents/components/SensitiveDocumentUnlockModal";
import {
  hasValidSensitiveStepUp,
  isSensitiveDocumentType,
  storeSensitiveStepUp,
} from "@/features/documents/sensitiveAccess";
import { api } from "@/lib/api";

type UnlockResult = { token: string; expires_in: number };

export type SensitiveAccessVariant = "document" | "ssn";

export function useSensitiveDocumentAccess(variant: SensitiveAccessVariant = "document") {
  const { user, token } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ resolve: (ok: boolean) => void } | null>(null);

  const close = useCallback(() => {
    pending?.resolve(false);
    setPending(null);
    setOpen(false);
  }, [pending]);

  const ensureAccess = useCallback(
    async (documentType: string | null | undefined): Promise<boolean> => {
      if (variant !== "ssn" && !isSensitiveDocumentType(documentType)) return true;
      if (hasValidSensitiveStepUp()) return true;
      if (variant !== "ssn" && user?.role.code === "CLIENT" && !user.totp_enabled) return true;

      return new Promise<boolean>((resolve) => {
        setPending({ resolve });
        setOpen(true);
      });
    },
    [user, variant],
  );

  async function handleSubmit(code: string) {
    if (!token) throw new Error("No autenticado");
    const result = await api.post<UnlockResult>("/auth/2fa/step-up", { code }, token, {
      silentHttpErrors: true,
    });
    storeSensitiveStepUp(result.token, result.expires_in);
    pending?.resolve(true);
    setPending(null);
    setOpen(false);
  }

  const modal = open ? (
    <SensitiveDocumentUnlockModal
      variant={variant}
      needsSetup={!user?.totp_enabled}
      onSubmit={handleSubmit}
      onClose={close}
      onGoToSettings={() => {
        close();
        router.push(user?.role.code === "CLIENT" ? "/portal/cuenta" : "/configuracion");
      }}
    />
  ) : null;

  return { ensureAccess, modal };
}
