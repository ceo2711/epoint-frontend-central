import { isAppReviewEmail } from "@/lib/app-review";

export function getDefaultAppPath(roleCode: string): string {
  return roleCode === "CLIENT" ? "/portal" : "/dashboard";
}

export function mustForcePasswordChange(
  user: { must_change_password: boolean; email?: string } | null,
): boolean {
  if (!user?.must_change_password) return false;
  if (isAppReviewEmail(user.email)) return false;
  return true;
}
