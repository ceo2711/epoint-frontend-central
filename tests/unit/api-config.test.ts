import { describe, expect, it } from "vitest";

import { normalizeApiBaseUrl } from "@/lib/api-config";

describe("normalizeApiBaseUrl", () => {
  it("fuerza IPv4 para evitar Failed to fetch en Windows", () => {
    expect(normalizeApiBaseUrl("http://localhost:8000/api/v1")).toBe(
      "http://127.0.0.1:8000/api/v1",
    );
  });

  it("deja 127.0.0.1 y hosts remotos igual", () => {
    expect(normalizeApiBaseUrl("http://127.0.0.1:8000/api/v1")).toBe(
      "http://127.0.0.1:8000/api/v1",
    );
    expect(normalizeApiBaseUrl("https://epoint-crm-backend.example/api/v1")).toBe(
      "https://epoint-crm-backend.example/api/v1",
    );
  });
});
