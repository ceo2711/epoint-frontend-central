"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { mustForcePasswordChange } from "@/features/auth/auth-redirect";

export function useRequirePasswordChanged(
  user: { must_change_password: boolean } | null,
  isLoading: boolean,
) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !user) return;
    if (mustForcePasswordChange(user) && pathname !== "/cambiar-contrasena") {
      router.replace("/cambiar-contrasena");
    }
  }, [user, isLoading, pathname, router]);
}
