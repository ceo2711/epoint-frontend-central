export const CLIENT_SOURCE_VALUES = [
  "WEB_PAGE",
  "WHATSAPP",
  "FACEBOOK",
  "INSTAGRAM",
  "REFERRAL",
  "PHONE_CALL",
  "INFLUENCERS",
  "OTHER",
] as const;

export type ClientSourceValue = (typeof CLIENT_SOURCE_VALUES)[number];

export const CLIENT_SOURCE_LABEL_KEYS: Record<ClientSourceValue, string> = {
  WEB_PAGE: "clients.sources.webPage",
  WHATSAPP: "clients.sources.whatsapp",
  FACEBOOK: "clients.sources.facebook",
  INSTAGRAM: "clients.sources.instagram",
  REFERRAL: "clients.sources.referral",
  PHONE_CALL: "clients.sources.phoneCall",
  INFLUENCERS: "clients.sources.influencers",
  OTHER: "clients.sources.other",
};

/** Label helper for known codes; falls back to the raw code for custom sources. */
export function clientSourceLabelKey(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code in CLIENT_SOURCE_LABEL_KEYS) {
    return CLIENT_SOURCE_LABEL_KEYS[code as ClientSourceValue];
  }
  return null;
}
