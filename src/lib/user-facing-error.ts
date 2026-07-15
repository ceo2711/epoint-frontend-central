import { ApiError } from "@/lib/api-error";

/** Mensaje genérico cuando falla la conexión (sin URLs ni detalles técnicos). */
export const NETWORK_ERROR_MESSAGE =
  "No pudimos conectar con el servicio. Intentá de nuevo en unos momentos.";

const TECHNICAL_MESSAGE_PATTERNS = [
  /https?:\/\//i,
  /\blocalhost\b/i,
  /\bapi\/v1\b/i,
  /backend est[eé] corriendo/i,
  /NEXT_PUBLIC_/i,
  /\bfetch failed\b/i,
  /failed to fetch/i,
  /networkerror/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ERR_CONNECTION/i,
];

export function isTechnicalErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function logClientError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") {
    console.error(`[${context}]`, error, extra ?? "");
    return;
  }
  console.error(`[${context}]`, error, extra ?? "");
}

/**
 * Mensaje seguro para mostrar en la UI. Los detalles técnicos quedan en consola.
 */
export function getUserFacingErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return fallback;
    if (isTechnicalErrorMessage(error.message)) return fallback;
    return error.message;
  }

  if (error instanceof Error) {
    if (isTechnicalErrorMessage(error.message)) return fallback;
    return error.message;
  }

  if (typeof error === "string") {
    if (isTechnicalErrorMessage(error)) return fallback;
    return error;
  }

  return fallback;
}
