"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShellProvider } from "@/contexts/ShellContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useRequirePasswordChanged } from "@/features/auth/PasswordChangeGuard";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  useRequirePasswordChanged(user, isLoading);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
    if (!isLoading && user && user.role.code !== "CLIENT") router.replace("/dashboard");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center app-shell-bg">
        <LoadingSpinner label="Cargando portal..." />
      </div>
    );
  }

  return (
    <ShellProvider>
      <AppShell>{children}</AppShell>
    </ShellProvider>
  );
}
