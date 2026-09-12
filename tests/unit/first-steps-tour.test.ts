import { describe, expect, it } from "vitest";

import {
  inflateRect,
  PORTAL_TOUR_STEPS,
  portalTourSelector,
  portalTourTargetForHref,
} from "@/features/portal/firstStepsTour";

describe("firstStepsTour", () => {
  it("covers the client sidebar in order", () => {
    expect(PORTAL_TOUR_STEPS.map((step) => step.id)).toEqual([
      "welcome",
      "portal",
      "datos",
      "documentos",
      "tablero",
    ]);
  });

  it("maps portal hrefs to tour targets", () => {
    expect(portalTourTargetForHref("/portal")).toBe("portal");
    expect(portalTourTargetForHref("/portal/datos")).toBe("datos");
    expect(portalTourTargetForHref("/portal/documentos")).toBe("documentos");
    expect(portalTourTargetForHref("/portal/tablero")).toBe("tablero");
    expect(portalTourTargetForHref("/dashboard")).toBeUndefined();
  });

  it("builds a data-attribute selector for the spotlight", () => {
    expect(portalTourSelector("datos")).toBe('[data-portal-tour="datos"]');
  });

  it("inflates the highlight around the target", () => {
    expect(inflateRect({ top: 40, left: 10, width: 100, height: 32 }, 8)).toEqual({
      top: 32,
      left: 2,
      width: 116,
      height: 48,
    });
  });
});
