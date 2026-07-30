"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthContext";
import { getAccessibleHrefs } from "@/lib/appNavigation";
import { prefetchAppData, prefetchCurrentRouteData } from "@/lib/appPrefetch";
import { prefetchAccessibleRouteModules } from "@/lib/lazyPanels";

/** Un tick corto para no competir con el paint de la ruta actual. */
const DEFERRED_DATA_PREFETCH_MS = 150;
/** Warm de bundles JS: menos crítico que los datos. */
const ROUTE_MODULE_PREFETCH_MS = 600;
const ROUTE_BUNDLE_PREFETCH_MS = 1_200;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function whenIdle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => resolve(), { timeout: 1_000 });
      return;
    }
    window.setTimeout(() => resolve(), 100);
  });
}

export function AppDataPrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, token, hasPermission } = useAuth();
  const prefetchedUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user || !token) {
      prefetchedUserIdRef.current = null;
      return;
    }

    // Se corta por usuario, no por token: el access token se renueva solo
    // (ACCESS_TOKEN_REFRESHED_EVENT) y si eso contara como sesión nueva
    // volveríamos a prefetchear todo cada vez que rota.
    if (prefetchedUserIdRef.current === user.id) return;
    prefetchedUserIdRef.current = user.id;

    const hrefs = getAccessibleHrefs(user, hasPermission);
    const initialPath = pathname;
    const currentHref = hrefs.find(
      (item) => initialPath === item || initialPath.startsWith(`${item}/`),
    );

    // No se cancela en el cleanup a propósito: en dev StrictMode desmonta y
    // remonta el efecto, y el segundo pase corta por el ref. Si esto se
    // cancelara, el prefetch nunca llegaría a ejecutarse.
    void (async () => {
      await prefetchCurrentRouteData(
        queryClient,
        token,
        user,
        hasPermission,
        initialPath,
      ).catch(() => undefined);

      await sleep(DEFERRED_DATA_PREFETCH_MS);
      await whenIdle();
      await prefetchAppData(queryClient, token, user, hasPermission, {
        skipHref: currentHref,
        currentPathname: initialPath,
      }).catch(() => undefined);

      await sleep(ROUTE_MODULE_PREFETCH_MS);
      await whenIdle();
      prefetchAccessibleRouteModules(hrefs);

      await sleep(ROUTE_BUNDLE_PREFETCH_MS);
      await whenIdle();
      for (const href of hrefs) {
        router.prefetch(href);
      }
    })();
    // pathname es solo el snapshot inicial de la sesión; no re-disparar al navegar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, hasPermission, queryClient, router]);

  return null;
}
