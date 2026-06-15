"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Role } from "@/features/roles/types";

export function useRoles(token: string | null, canRead: boolean, loadErrorMessage: string, noPermissionMessage: string) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get<Role[]>("/roles?include_inactive=true", token);
      setRoles(data);
    } catch {
      setError(loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, loadErrorMessage]);

  useEffect(() => {
    if (canRead) loadRoles();
    else {
      setLoading(false);
      setError(noPermissionMessage);
    }
  }, [canRead, loadRoles, noPermissionMessage]);

  return { roles, loading, error };
}
