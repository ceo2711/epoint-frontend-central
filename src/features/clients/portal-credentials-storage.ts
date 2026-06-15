const STORAGE_PREFIX = "epoint_portal_creds_";

export interface PortalCredentials {
  email: string;
  tempPassword: string;
  portalLoginUrl?: string;
  savedAt: string;
}

export function savePortalCredentials(clientId: number, creds: Omit<PortalCredentials, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: PortalCredentials = { ...creds, savedAt: new Date().toISOString() };
  sessionStorage.setItem(`${STORAGE_PREFIX}${clientId}`, JSON.stringify(payload));
}

export function loadPortalCredentials(clientId: number): PortalCredentials | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${clientId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalCredentials;
  } catch {
    return null;
  }
}

export function clearPortalCredentials(clientId: number) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${STORAGE_PREFIX}${clientId}`);
}
