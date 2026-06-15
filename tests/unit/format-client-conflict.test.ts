import { describe, expect, it } from "vitest";

import { formatClientConflict } from "@/features/clients/utils";

describe("formatClientConflict", () => {
  const t = (key: string, params?: Record<string, string | number>) =>
    params ? `${key}:${params.name}:${params.id}` : key;

  it("formats email conflicts", () => {
    const message = formatClientConflict(t, "email", {
      client_id: 7,
      client_name: "Juan Pérez",
      client_email: "juan@test.com",
    });
    expect(message).toBe("clients.duplicateEmail:Juan Pérez:7");
  });

  it("formats phone conflicts", () => {
    const message = formatClientConflict(t, "phone", {
      client_id: 3,
      client_name: "Ana López",
      client_email: "ana@test.com",
    });
    expect(message).toBe("clients.duplicatePhone:Ana López:3");
  });
});
