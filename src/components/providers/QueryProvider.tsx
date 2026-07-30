"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const STALE_TIME_MS = 5 * 60_000;
/**
 * Muy por encima del staleTime: los datos que trae el prefetch post-login no
 * tienen observers hasta que abrís la vista, y con un gcTime corto React Query
 * los recolecta antes de que llegues a usarlos (y la vista vuelve a pedirlos).
 */
const GC_TIME_MS = 30 * 60_000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_MS,
            gcTime: GC_TIME_MS,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
