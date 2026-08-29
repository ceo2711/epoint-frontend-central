import { en } from "./locales/en";
import { es, type Messages } from "./locales/es";

export type { Messages };

export type Locale = "es" | "en";

export const locales: Locale[] = ["es", "en"];
export const defaultLocale: Locale = "es";

const messages: Record<Locale, Messages> = { es, en };

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages[defaultLocale];
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let value: unknown = getMessages(locale);
  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
  }
  if (typeof value !== "string") return key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (text, [param, val]) => text.replace(`{${param}}`, String(val)),
    value,
  );
}

export function translateStatus(
  locale: Locale,
  group: "clientStatus" | "taskStatus" | "verificationStatus" | "documentTypes",
  code: string,
): string {
  const groupMessages = getMessages(locale)[group] as Record<string, string>;
  return groupMessages[code] ?? code;
}

export function translateRole(locale: Locale, code: string, fallback?: string): string {
  const roleMessages = getMessages(locale).roleNames as Record<string, string> | undefined;
  return roleMessages?.[code] ?? fallback ?? code;
}

export const LOCALE_STORAGE_KEY = "epoint-crm-locale";
