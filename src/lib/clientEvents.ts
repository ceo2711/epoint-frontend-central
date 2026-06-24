export const CLIENTS_REFRESH_EVENT = "epoint:clients-refresh";

export interface ClientsRefreshDetail {
  clientId?: number;
}

export function emitClientsRefresh(detail?: ClientsRefreshDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ClientsRefreshDetail>(CLIENTS_REFRESH_EVENT, { detail }));
}

export function shouldRefreshClient(
  detail: ClientsRefreshDetail | undefined,
  clientId: number | null | undefined,
): boolean {
  if (!clientId) return false;
  if (!detail?.clientId) return true;
  return detail.clientId === clientId;
}
