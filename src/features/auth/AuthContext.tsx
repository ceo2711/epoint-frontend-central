"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { setUnauthorizedHandler } from "@/features/auth/auth-unauthorized";
import {
  persistLoginSession,
  restoreSession,
  revokeSession,
} from "@/features/auth/auth-session";
import { clearToken } from "@/features/auth/auth-storage";
import type { LoginResponse, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await restoreSession();
    if (!session) {
      setUser(null);
      setTokenState(null);
      return;
    }
    setUser(session.user);
    setTokenState(session.token);
  }, []);

  useEffect(() => {
    restoreSession()
      .then((session) => {
        if (!session) return;
        setUser(session.user);
        setTokenState(session.token);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
      setTokenState(null);
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<LoginResponse>("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      persistLoginSession(response.access_token, response.refresh_token);
      setTokenState(response.access_token);
      setUser(response.user);
      if (response.must_change_password) {
        router.push("/cambiar-contrasena");
      } else if (response.user.role.code === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    void revokeSession();
    clearToken();
    setUser(null);
    setTokenState(null);
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.role.code === "ADMIN") return true;
      return user.permissions?.includes(permission) ?? false;
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, refreshUser, hasPermission }),
    [user, token, isLoading, login, logout, refreshUser, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
