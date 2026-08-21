/** Cuenta de App Store Review: no se le exige 2FA ni cambio de contraseña. */
export const APP_REVIEW_EMAILS = new Set(["appreview@epoint.com"]);

export function isAppReviewEmail(email?: string | null): boolean {
  if (!email) return false;
  return APP_REVIEW_EMAILS.has(email.trim().toLowerCase());
}
