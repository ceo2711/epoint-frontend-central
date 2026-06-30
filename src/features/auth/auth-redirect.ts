export function getDefaultAppPath(roleCode: string): string {
  return roleCode === "CLIENT" ? "/portal" : "/dashboard";
}

export function mustForcePasswordChange(user: { must_change_password: boolean } | null): boolean {
  return Boolean(user?.must_change_password);
}
