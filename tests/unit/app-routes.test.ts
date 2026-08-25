import { describe, expect, it } from "vitest";

import { isKnownAppPath, normalizePathname } from "@/lib/app-routes";

describe("app-routes", () => {
  it("acepta rutas públicas y de la app", () => {
    expect(isKnownAppPath("/")).toBe(true);
    expect(isKnownAppPath("/login")).toBe(true);
    expect(isKnownAppPath("/dashboard")).toBe(true);
    expect(isKnownAppPath("/clientes/42")).toBe(true);
    expect(isKnownAppPath("/prospectos")).toBe(true);
    expect(isKnownAppPath("/prospectos/7")).toBe(true);
    expect(isKnownAppPath("/calendario")).toBe(true);
    expect(isKnownAppPath("/pagos")).toBe(true);
    expect(isKnownAppPath("/pagar/abc123")).toBe(true);
    expect(isKnownAppPath("/portal/tablero")).toBe(true);
    expect(isKnownAppPath("/portal/cursos")).toBe(true);
    expect(isKnownAppPath("/cursos")).toBe(true);
    expect(isKnownAppPath("/portal/mentorias")).toBe(true);
    expect(isKnownAppPath("/recuperar-contrasena/confirmar")).toBe(true);
  });

  it("rechaza rutas inexistentes o removidas", () => {
    expect(isKnownAppPath("/notificaciones")).toBe(false);
    expect(isKnownAppPath("/portal/notificaciones")).toBe(false);
    expect(isKnownAppPath("/ruta-inventada")).toBe(false);
    expect(isKnownAppPath("/clientes/abc")).toBe(false);
    expect(isKnownAppPath("/dashboard/extra")).toBe(false);
  });

  it("normaliza trailing slash y query", () => {
    expect(normalizePathname("/dashboard/")).toBe("/dashboard");
    expect(normalizePathname("/login?next=/clientes")).toBe("/login");
  });
});
