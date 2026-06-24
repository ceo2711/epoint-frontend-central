"use client";

import { useParams, usePathname } from "next/navigation";

export function useChatClientIdHint(): number | null {
  const params = useParams();
  const pathname = usePathname();
  const rawId = params?.id;

  if (!pathname?.includes("/clientes/") || typeof rawId !== "string") {
    return null;
  }

  const id = Number(rawId);
  return Number.isFinite(id) && id > 0 ? id : null;
}
