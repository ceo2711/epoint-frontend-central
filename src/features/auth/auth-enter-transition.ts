const AUTH_ENTER_KEY = "epoint-auth-enter";

/** Marca que el próximo mount del panel debe animar la entrada. */
export function markAuthEnterTransition(): void {
  try {
    sessionStorage.setItem(AUTH_ENTER_KEY, "1");
  } catch {
    // ignore
  }
}

/** Consume el flag (una sola vez). */
export function consumeAuthEnterTransition(): boolean {
  try {
    if (sessionStorage.getItem(AUTH_ENTER_KEY) !== "1") return false;
    sessionStorage.removeItem(AUTH_ENTER_KEY);
    return true;
  } catch {
    return false;
  }
}
