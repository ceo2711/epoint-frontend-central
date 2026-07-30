import { describe, expect, it } from "vitest";

import { sortHrefsForPrefetch } from "@/lib/appPrefetch";
import {
  EVENTS_FRESH_MS,
  isCalendlyEventsFresh,
} from "@/features/calendly/utils/eventTypesCache";

describe("sortHrefsForPrefetch", () => {
  it("pone la ruta actual primero y luego las vistas pesadas", () => {
    const hrefs = ["/usuarios", "/pagos", "/clientes", "/sedes", "/calendario", "/dashboard"];
    expect(sortHrefsForPrefetch(hrefs, "/dashboard")).toEqual([
      "/dashboard",
      "/calendario",
      "/clientes",
      "/pagos",
      "/usuarios",
      "/sedes",
    ]);
  });

  it("sin ruta actual ordena solo por prioridad", () => {
    const hrefs = ["/roles", "/prospectos", "/calendario"];
    expect(sortHrefsForPrefetch(hrefs)).toEqual(["/calendario", "/prospectos", "/roles"]);
  });
});

describe("isCalendlyEventsFresh", () => {
  it("es true si dataUpdatedAt es reciente", () => {
    const now = 1_000_000;
    expect(isCalendlyEventsFresh(now - 10_000, now)).toBe(true);
  });

  it("es false si dataUpdatedAt es 0 o viejo", () => {
    const now = 1_000_000;
    expect(isCalendlyEventsFresh(0, now)).toBe(false);
    expect(isCalendlyEventsFresh(now - EVENTS_FRESH_MS - 1, now)).toBe(false);
  });
});
