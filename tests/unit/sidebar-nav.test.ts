import { describe, expect, it } from "vitest";

import { resolveActiveHref } from "@/components/layout/sidebarNav";

const portalHrefs = [
  "/portal",
  "/portal/datos",
  "/portal/documentos",
  "/portal/tablero",
];

describe("resolveActiveHref", () => {
  it("activates only my data on /portal/datos", () => {
    expect(resolveActiveHref("/portal/datos", portalHrefs)).toBe("/portal/datos");
  });

  it("activates my portal only on exact /portal", () => {
    expect(resolveActiveHref("/portal", portalHrefs)).toBe("/portal");
  });

  it("activates client detail under /clientes", () => {
    expect(resolveActiveHref("/clientes/42", ["/dashboard", "/clientes"])).toBe("/clientes");
  });
});
