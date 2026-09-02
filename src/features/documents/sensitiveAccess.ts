const STORAGE_KEY = "epoint_sensitive_step_up";

type StoredStepUp = {
  token: string;
  expiresAt: number;
};

function readStored(): StoredStepUp | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredStepUp;
    if (!parsed.token || !parsed.expiresAt) return null;
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getSensitiveStepUpToken(): string | null {
  return readStored()?.token ?? null;
}

export function sensitiveStepUpHeaders(): Record<string, string> {
  const token = getSensitiveStepUpToken();
  return token ? { "X-Sensitive-Access": token } : {};
}

export function storeSensitiveStepUp(token: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + Math.max(expiresInSeconds, 60) * 1000;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt }));
}

export function hasValidSensitiveStepUp(): boolean {
  return getSensitiveStepUpToken() !== null;
}

export function isSensitiveDocumentType(_documentType?: string | null): boolean {
  return true;
}
