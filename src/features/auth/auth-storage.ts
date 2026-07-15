const TOKEN_KEY = "epoint_access_token";
const REFRESH_TOKEN_KEY = "epoint_refresh_token";
const TWO_FA_TEMP_TOKEN_KEY = "epoint_2fa_temp_token";

export const ACCESS_TOKEN_REFRESHED_EVENT = "epoint:access-token-refreshed";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ACCESS_TOKEN_REFRESHED_EVENT, { detail: { token } }),
    );
  }
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function setSession(accessToken: string, refreshToken: string): void {
  setToken(accessToken);
  setRefreshToken(refreshToken);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TWO_FA_TEMP_TOKEN_KEY);
}

export function setTwoFactorTempToken(token: string): void {
  localStorage.setItem(TWO_FA_TEMP_TOKEN_KEY, token);
}

export function getTwoFactorTempToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TWO_FA_TEMP_TOKEN_KEY);
}

export function clearTwoFactorTempToken(): void {
  localStorage.removeItem(TWO_FA_TEMP_TOKEN_KEY);
}
