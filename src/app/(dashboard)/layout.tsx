"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShellProvider } from "@/contexts/ShellContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useRequirePasswordChanged } from "@/features/auth/PasswordChangeGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  useRequirePasswordChanged(user, isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role.code === "CLIENT") {
      router.replace("/portal");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role.code === "CLIENT") {
    return (
      <div className="flex min-h-screen items-center justify-center app-shell-bg">
        <LoadingSpinner label="Cargando..." />
      </div>
    );
  }

  return (
    <ShellProvider>
      <AppShell>{children}</AppShell>
    </ShellProvider>
  );
}
