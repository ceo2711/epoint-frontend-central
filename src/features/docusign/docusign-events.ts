export const DOCUSIGN_REFRESH_EVENT = "epoint:docusign-refresh";

export interface DocusignRefreshDetail {
  envelopeId?: number;
}

export function dispatchDocusignRefresh(detail?: DocusignRefreshDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DocusignRefreshDetail>(DOCUSIGN_REFRESH_EVENT, { detail }));
}
