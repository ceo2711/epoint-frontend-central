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

import {
  getDefaultAppPath,
  mustForcePasswordChange,
} from "@/features/auth/auth-redirect";
import { api } from "@/lib/api";
import { setUnauthorizedHandler } from "@/features/auth/auth-unauthorized";
import {
  persistLoginSession,
  restoreSession,
  revokeSession,
} from "@/features/auth/auth-session";
import {
  clearToken,
  clearTwoFactorTempToken,
  getToken,
  getTwoFactorTempToken,
  setTwoFactorTempToken,
} from "@/features/auth/auth-storage";
import type { LoginResponse, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresTwoFactor: boolean; userName?: string }>;
  completeTwoFactorLogin: (code: string) => Promise<void>;
  cancelTwoFactorLogin: () => void;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await restoreSession();
    if (!session) {
      setUser(null);
      setTokenState(null);
      return null;
    }
    setUser(session.user);
    setTokenState(session.token);
    return session.user;
  }, []);

  useEffect(() => {
    restoreSession()
      .then((session) => {
        if (!session) return;
        setUser(session.user);
        setTokenState(session.token);
        if (mustForcePasswordChange(session.user)) {
          router.replace("/cambiar-contrasena");
        }
      })
      .finally(() => setIsLoading(false));
  }, [router]);

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

      if (response.requires_2fa && response.temp_token) {
        setTwoFactorTempToken(response.temp_token);
        const userName = response.user
          ? `${response.user.first_name} ${response.user.last_name}`.trim()
          : undefined;
        return { requiresTwoFactor: true, userName };
      }

      if (!response.access_token || !response.refresh_token || !response.user) {
        throw new Error("Respuesta de login inválida");
      }

      persistLoginSession(response.access_token, response.refresh_token);
      setTokenState(response.access_token);
      setUser(response.user);
      if (response.must_change_password) {
        router.push("/cambiar-contrasena");
      } else {
        router.push(getDefaultAppPath(response.user.role.code));
      }
      return { requiresTwoFactor: false };
    },
    [router],
  );

  const cancelTwoFactorLogin = useCallback(() => {
    clearTwoFactorTempToken();
  }, []);

  const completeTwoFactorLogin = useCallback(
    async (code: string) => {
      const tempToken = getTwoFactorTempToken();
      if (!tempToken) {
        router.replace("/login");
        return;
      }

      const response = await api.post<LoginResponse>("/auth/2fa/verify", {
        temp_token: tempToken,
        code,
      });

      if (!response.access_token || !response.refresh_token || !response.user) {
        throw new Error("Respuesta 2FA inválida");
      }

      clearTwoFactorTempToken();
      persistLoginSession(response.access_token, response.refresh_token);
      setTokenState(response.access_token);
      setUser(response.user);

      if (response.must_change_password) {
        router.push("/cambiar-contrasena");
      } else {
        router.push(getDefaultAppPath(response.user.role.code));
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    void revokeSession();
    clearToken();
    clearTwoFactorTempToken();
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
    () => ({
      user,
      token,
      isLoading,
      login,
      completeTwoFactorLogin,
      cancelTwoFactorLogin,
      logout,
      refreshUser,
      hasPermission,
    }),
    [user, token, isLoading, login, completeTwoFactorLogin, cancelTwoFactorLogin, logout, refreshUser, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
