import { describe, expect, it, vi } from "vitest";

import { formatDateTime } from "@/lib/format-datetime";

describe("formatDateTime", () => {
  it("returns dash for empty values", () => {
    expect(formatDateTime(null, "es")).toBe("—");
    expect(formatDateTime(undefined, "en")).toBe("—");
  });

  it("returns dash for invalid dates", () => {
    expect(formatDateTime("invalid-date", "es")).toBe("—");
  });

  it("formats recent times in spanish", () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60_000).toISOString();
    expect(formatDateTime(twoMinutesAgo, "es")).toBe("Hace 2 min");
  });

  it("formats recent times in english", () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60_000).toISOString();
    expect(formatDateTime(twoMinutesAgo, "en")).toBe("2 min ago");
  });

  it("formats older dates with locale", () => {
    const old = "2020-01-15T10:30:00.000Z";
    const formatted = formatDateTime(old, "es");
    expect(formatted).not.toBe("—");
    expect(formatted.length).toBeGreaterThan(5);
  });
});
