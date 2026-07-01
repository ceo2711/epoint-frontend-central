const CALENDLY_REFRESH_EVENT = "epoint:calendly-refresh";

export function emitCalendlyRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CALENDLY_REFRESH_EVENT));
}

export function onCalendlyRefresh(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CALENDLY_REFRESH_EVENT, listener);
  return () => window.removeEventListener(CALENDLY_REFRESH_EVENT, listener);
}
