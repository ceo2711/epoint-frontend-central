"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthContext";
import { getAccessibleHrefs } from "@/lib/appNavigation";
import { prefetchAppData } from "@/lib/appPrefetch";

function scheduleIdle(task: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => task(), { timeout: 4_000 });
    return;
  }
  window.setTimeout(task, 250);
}

export function AppDataPrefetcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, hasPermission } = useAuth();
  const prefetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      prefetchedKeyRef.current = null;
      return;
    }

    const sessionKey = `${user.id}:${token.slice(-12)}`;
    if (prefetchedKeyRef.current === sessionKey) return;
    prefetchedKeyRef.current = sessionKey;

    const hrefs = getAccessibleHrefs(user, hasPermission);
    for (const href of hrefs) {
      router.prefetch(href);
    }

    scheduleIdle(() => {
      void prefetchAppData(queryClient, token, user, hasPermission);
    });
  }, [user, token, hasPermission, queryClient, router]);

  return null;
}
