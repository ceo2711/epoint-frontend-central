import { beforeEach, describe, expect, it } from "vitest";

import {
  CALENDLY_SYNC_MIN_INTERVAL_MS,
  markCalendlySync,
  resetCalendlySyncRegistry,
  shouldSyncCalendly,
} from "@/features/calendly/utils/syncRegistry";

beforeEach(() => {
  resetCalendlySyncRegistry();
});

describe("registro de sync de Calendly", () => {
  it("permite el primer sync", () => {
    expect(shouldSyncCalendly(100)).toBe(true);
  });

  it("bloquea un segundo sync dentro de la ventana", () => {
    const now = 1_000_000;
    markCalendlySync(100, now);
    expect(shouldSyncCalendly(100, now + 1_000)).toBe(false);
  });

  it("vuelve a permitir pasada la ventana", () => {
    const now = 1_000_000;
    markCalendlySync(100, now);
    expect(shouldSyncCalendly(100, now + CALENDLY_SYNC_MIN_INTERVAL_MS)).toBe(true);
  });

  it("lleva la cuenta por usuario", () => {
    const now = 1_000_000;
    markCalendlySync(100, now);
    expect(shouldSyncCalendly(100, now + 1_000)).toBe(false);
    expect(shouldSyncCalendly(200, now + 1_000)).toBe(true);
  });

  it("trata null y undefined como el mismo usuario propio", () => {
    const now = 1_000_000;
    markCalendlySync(undefined, now);
    expect(shouldSyncCalendly(null, now + 1_000)).toBe(false);
  });
});
