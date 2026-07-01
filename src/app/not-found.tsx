"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getDefaultAppPath } from "@/features/auth/auth-redirect";
import { useAuth } from "@/features/auth/AuthContext";

/** Respaldo si alguna ruta dispara not-found(): nunca mostrar 404 al usuario. */
export default function NotFound() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(getDefaultAppPath(user.role.code));
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center app-shell-bg">
      <LoadingSpinner />
    </div>
  );
}
