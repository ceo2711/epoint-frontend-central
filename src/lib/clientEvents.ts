export const CLIENTS_REFRESH_EVENT = "epoint:clients-refresh";

export type ClientsRefreshScope = "all" | "documents" | "board";

export interface ClientsRefreshDetail {
  clientId?: number;
  merchantId?: number;
  showAllMerchants?: boolean;
  scope?: ClientsRefreshScope;
  /** El cliente fue eliminado; la vista de detalle no debe recargarlo. */
  deleted?: boolean;
}

export function emitClientsRefresh(detail?: ClientsRefreshDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ClientsRefreshDetail>(CLIENTS_REFRESH_EVENT, { detail }));
}

export function onClientsRefresh(listener: (detail?: ClientsRefreshDetail) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ClientsRefreshDetail>).detail;
    listener(detail);
  };
  window.addEventListener(CLIENTS_REFRESH_EVENT, handler);
  return () => window.removeEventListener(CLIENTS_REFRESH_EVENT, handler);
}

export function shouldRefreshClient(
  detail: ClientsRefreshDetail | undefined,
  clientId: number | null | undefined,
): boolean {
  if (!clientId) return false;
  if (detail?.deleted && detail.clientId === clientId) return false;
  if (!detail?.clientId) return true;
  return detail.clientId === clientId;
}
