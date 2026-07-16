import { describe, expect, it } from "vitest";

import { buildFunnelStageConversion, getConversionHealth } from "@/features/dashboard/utils/funnelConversion";

describe("buildFunnelStageConversion", () => {
  it("computes cumulative advancement rates between funnel stages", () => {
    const rows = buildFunnelStageConversion([
      { status: "PENDIENTE_CONTACTAR", count: 10 },
      { status: "LEAD_CONTACTADO", count: 6 },
      { status: "CONTRATO_ENVIADO", count: 4 },
      { status: "PAGO_COMPLETADO", count: 2 },
      { status: "LEAD_CERRADO", count: 99 },
    ]);

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      status: "PENDIENTE_CONTACTAR",
      count: 10,
      reached: 22,
      conversionRate: null,
    });
    expect(rows[1]).toMatchObject({
      status: "LEAD_CONTACTADO",
      count: 6,
      reached: 12,
      conversionRate: 55,
    });
    expect(rows[3]).toMatchObject({
      status: "PAGO_COMPLETADO",
      count: 2,
      reached: 2,
      conversionRate: 33,
    });
  });

  it("returns null rate only for the first stage", () => {
    const rows = buildFunnelStageConversion([{ status: "PAGO_COMPLETADO", count: 3 }]);
    expect(rows[0].conversionRate).toBeNull();
    expect(rows[0].reached).toBe(3);
    expect(rows[3]).toMatchObject({ count: 3, reached: 3, conversionRate: 100 });
  });
});

describe("getConversionHealth", () => {
  it("classifies rates", () => {
    expect(getConversionHealth(null)).toBe("neutral");
    expect(getConversionHealth(70)).toBe("good");
    expect(getConversionHealth(55)).toBe("watch");
    expect(getConversionHealth(40)).toBe("critical");
  });
});
