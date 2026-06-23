export const CLIENT_SOURCE_VALUES = [
  "WEB_PAGE",
  "WHATSAPP",
  "FACEBOOK",
  "INSTAGRAM",
  "REFERRAL",
  "PHONE_CALL",
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
  OTHER: "clients.sources.other",
};
