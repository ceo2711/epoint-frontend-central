export const CLIENTS_REFRESH_EVENT = "epoint:clients-refresh";

export function emitClientsRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CLIENTS_REFRESH_EVENT));
}
