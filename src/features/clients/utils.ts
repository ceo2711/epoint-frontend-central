import type { ClientConflict } from "@/types/api";

export function formatClientConflict(
  t: (key: string, params?: Record<string, string | number>) => string,
  kind: "email" | "phone",
  conflict: ClientConflict,
) {
  return t(kind === "email" ? "clients.duplicateEmail" : "clients.duplicatePhone", {
    name: conflict.client_name,
    id: conflict.client_id,
  });
}
