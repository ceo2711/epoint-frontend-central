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

export function shouldShowFirstSteps(
  user: {
    role?: { code: string };
    needs_first_steps?: boolean;
    must_change_password: boolean;
    email?: string;
  } | null,
): boolean {
  if (!user) return false;
  if (user.role?.code !== "CLIENT") return false;
  if (mustForcePasswordChange(user)) return false;
  return Boolean(user.needs_first_steps);
}
