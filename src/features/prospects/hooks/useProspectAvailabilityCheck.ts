"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { ProspectAvailability, ProspectContactConflict } from "@/types/api";

const DEBOUNCE_MS = 400;

export interface UseProspectAvailabilityOptions {
  excludeProspectId?: number | null;
  enabled?: boolean;
}

export function useProspectAvailabilityCheck(
  token: string | null,
  merchantId: string | number | null,
  email: string,
  phone: string,
  { excludeProspectId = null, enabled = true }: UseProspectAvailabilityOptions = {},
) {
  const [availability, setAvailability] = useState<ProspectAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const merchantNumber = merchantId ? Number(merchantId) : null;
    if (!token || !enabled || !merchantNumber) {
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
      params.set("merchant_id", String(merchantNumber));
      if (canCheckEmail) params.set("email", trimmedEmail);
      if (canCheckPhone) params.set("phone", trimmedPhone);
      if (excludeProspectId != null) params.set("exclude_prospect_id", String(excludeProspectId));

      try {
        const data = await api.get<ProspectAvailability>(
          `/prospects/check-availability?${params.toString()}`,
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
  }, [token, merchantId, email, phone, excludeProspectId, enabled]);

  const hasConflict = Boolean(availability?.email || availability?.phone);

  return { availability, checking, hasConflict };
}

export function formatProspectConflict(
  t: (key: string, params?: Record<string, string | number>) => string,
  kind: "email" | "phone",
  conflict: ProspectContactConflict,
) {
  const entity = t(
    conflict.kind === "client" ? "prospects.conflictClient" : "prospects.conflictProspect",
  );
  return t(kind === "email" ? "prospects.duplicateEmail" : "prospects.duplicatePhone", {
    name: conflict.client_name,
    entity,
  });
}
