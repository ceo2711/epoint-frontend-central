"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthContext";
import { getAccessibleHrefs } from "@/lib/appNavigation";
import { prefetchAppData, prefetchCurrentRouteData } from "@/lib/appPrefetch";
import { prefetchAccessibleRouteModules } from "@/lib/lazyPanels";

/** Esperar a que la ruta actual pinte antes de prefetch de datos. */
const CURRENT_ROUTE_PREFETCH_MS = 2_500;
/** Calentar bundles JS de las rutas del menú en idle. */
const ROUTE_MODULE_PREFETCH_MS = 1_500;
const ROUTE_BUNDLE_PREFETCH_MS = 3_000;
const DEFERRED_PREFETCH_MS = 12_000;

function scheduleIdle(task: () => void, fallbackMs = 250) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => task(), { timeout: 2_000 });
    return;
  }
  window.setTimeout(task, fallbackMs);
}

export function AppDataPrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
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

    const moduleTimer = window.setTimeout(() => {
      scheduleIdle(() => {
        prefetchAccessibleRouteModules(hrefs);
      }, 300);
    }, ROUTE_MODULE_PREFETCH_MS);

    const routeBundleTimer = window.setTimeout(() => {
      scheduleIdle(() => {
        for (const href of hrefs) {
          router.prefetch(href);
        }
      }, 500);
    }, ROUTE_BUNDLE_PREFETCH_MS);

    const currentRouteTimer = window.setTimeout(() => {
      scheduleIdle(() => {
        void prefetchCurrentRouteData(queryClient, token, user, hasPermission, pathname);
      });
    }, CURRENT_ROUTE_PREFETCH_MS);

    const deferredTimer = window.setTimeout(() => {
      scheduleIdle(() => {
        void prefetchAppData(queryClient, token, user, hasPermission, { skipHref: pathname });
      }, 500);
    }, DEFERRED_PREFETCH_MS);

    return () => {
      window.clearTimeout(moduleTimer);
      window.clearTimeout(routeBundleTimer);
      window.clearTimeout(currentRouteTimer);
      window.clearTimeout(deferredTimer);
    };
  }, [user, token, hasPermission, queryClient, router, pathname]);

  return null;
}
