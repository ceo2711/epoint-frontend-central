"use client";

import { useRouter } from "next/navigation";

import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";

export default function CambiarContrasenaPage() {
  const router = useRouter();
  const { token, refreshUser } = useAuth();

  async function handleSubmit(currentPassword: string, newPassword: string) {
    await api.post(
      "/auth/change-password",
      { current_password: currentPassword, new_password: newPassword },
      token,
    );
    await refreshUser();
    router.push("/dashboard");
  }

  return <ChangePasswordForm onSubmit={handleSubmit} />;
}
