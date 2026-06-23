"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Paginated, User } from "@/features/users/types";

export function useUsers(token: string | null, canRead: boolean, loadErrorMessage: string, noPermissionMessage: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get<Paginated<User>>("/users", token);
      setUsers(data.items);
    } catch {
      setError(loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, loadErrorMessage]);

  useEffect(() => {
    if (canRead) loadUsers();
    else {
      setLoading(false);
      setError(noPermissionMessage);
    }
  }, [canRead, loadUsers, noPermissionMessage]);

  return { users, loading, error, reload: loadUsers };
}
