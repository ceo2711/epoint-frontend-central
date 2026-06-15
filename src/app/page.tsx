"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.role.code === "CLIENT") router.replace("/portal");
    else router.replace("/dashboard");
  }, [user, isLoading, router]);

  return <LoadingSpinner />;
}
