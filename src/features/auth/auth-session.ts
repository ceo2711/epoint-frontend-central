import {
  clearToken,
  getRefreshToken,
  getToken,
  setSession,
  setToken,
} from "@/features/auth/auth-storage";
import { getApiBaseUrl } from "@/lib/api-config";
import { logClientError, NETWORK_ERROR_MESSAGE } from "@/lib/user-facing-error";
import type { User } from "@/types/api";

const API_URL = getApiBaseUrl();

const RESTORE_MAX_ATTEMPTS = 6;
const RESTORE_RETRY_MS = 1000;

class SessionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "SessionError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) return null;

        const data = (await response.json()) as { access_token: string };
        setToken(data.access_token);
        return data.access_token;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function fetchCurrentUser(token: string): Promise<User> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (cause) {
    logClientError("auth:me", cause, { baseUrl: API_URL });
    throw new SessionError(0, NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    let message = "No autenticado";
    try {
      const data = await response.json();
      message = String(data.detail ?? message);
    } catch {
      message = response.statusText || message;
    }
    throw new SessionError(response.status, message);
  }

  return response.json() as Promise<User>;
}

export async function restoreSession(): Promise<{ user: User; token: string } | null> {
  let token = getToken();

  for (let attempt = 0; attempt < RESTORE_MAX_ATTEMPTS; attempt += 1) {
    if (!token) {
      token = await refreshAccessToken();
    }
    if (!token) return null;

    try {
      const user = await fetchCurrentUser(token);
      return { user, token };
    } catch (error) {
      if (error instanceof SessionError && error.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed && refreshed !== token) {
          token = refreshed;
          continue;
        }
        clearToken();
        return null;
      }

      if (error instanceof SessionError && error.status === 0 && attempt < RESTORE_MAX_ATTEMPTS - 1) {
        await sleep(RESTORE_RETRY_MS);
        continue;
      }

      if (error instanceof SessionError && error.status === 0) {
        return null;
      }

      clearToken();
      return null;
    }
  }

  return null;
}

export function persistLoginSession(accessToken: string, refreshToken: string) {
  setSession(accessToken, refreshToken);
}

export async function revokeSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  const accessToken = getToken();
  if (!refreshToken || !accessToken) return;

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Si el backend no responde, igual limpiamos la sesión local.
  }
}
