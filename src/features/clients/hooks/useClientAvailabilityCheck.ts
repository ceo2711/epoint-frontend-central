"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { ClientAvailability } from "@/types/api";

const DEBOUNCE_MS = 400;

export interface UseClientAvailabilityOptions {
  excludeClientId?: number | null;
  enabled?: boolean;
}

export function useClientAvailabilityCheck(
  token: string | null,
  email: string,
  phone: string,
  { excludeClientId = null, enabled = true }: UseClientAvailabilityOptions = {},
) {
  const [availability, setAvailability] = useState<ClientAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!token || !enabled) {
      setAvailability(null);
      setChecking(false);
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const canCheckEmail = trimmedEmail.includes("@") && trimmedEmail.includes(".");
    const canCheckPhone = trimmedPhone.length >= 5;

    if (!canCheckEmail && !canCheckPhone) {
      setAvailability(null);
      setChecking(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setChecking(true);

    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams();
      if (canCheckEmail) params.set("email", trimmedEmail);
      if (canCheckPhone) params.set("phone", trimmedPhone);
      if (excludeClientId != null) params.set("exclude_client_id", String(excludeClientId));

      try {
        const data = await api.get<ClientAvailability>(
          `/clients/check-availability?${params.toString()}`,
          token,
        );
        if (currentRequest === requestId.current) {
          setAvailability(data);
        }
      } catch {
        if (currentRequest === requestId.current) {
          setAvailability(null);
        }
      } finally {
        if (currentRequest === requestId.current) {
          setChecking(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [token, email, phone, excludeClientId, enabled]);

  const hasConflict = Boolean(availability?.email || availability?.phone);

  return { availability, checking, hasConflict };
}

export { formatClientConflict } from "@/features/clients/utils";
