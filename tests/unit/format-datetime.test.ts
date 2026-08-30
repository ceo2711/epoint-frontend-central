import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateInput,
  formatDateTime,
  formatMonthYear,
  formatRelativeDateTime,
  formatShortDate,
  maskDateInput,
  parseDateInputToIso,
} from "@/lib/format-datetime";

describe("formatDate", () => {
  it("formats ISO date-only without timezone shift", () => {
    expect(formatDate("2020-01-15")).toBe("01/15/2020");
  });

  it("returns dash for empty values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("returns dash for empty or invalid values", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("invalid-date")).toBe("—");
  });

  it("keeps date-only values without a time", () => {
    expect(formatDateTime("2020-08-29")).toBe("08/29/2020");
  });
});

describe("date input helpers", () => {
  it("formats ISO values for the text field", () => {
    expect(formatDateInput("1990-12-05")).toBe("12/05/1990");
    expect(formatDateInput("")).toBe("");
  });

  it("masks digits as MM/DD/YYYY", () => {
    expect(maskDateInput("12051990")).toBe("12/05/1990");
    expect(maskDateInput("05")).toBe("05");
  });

  it("parses MM/DD/YYYY to ISO", () => {
    expect(parseDateInputToIso("12/05/1990")).toBe("1990-12-05");
    expect(parseDateInputToIso("05/12/1990")).toBe("1990-05-12");
  });

  it("falls back to DD/MM when the first number cannot be a month", () => {
    expect(parseDateInputToIso("29/08/1990")).toBe("1990-08-29");
  });
});

describe("formatShortDate and formatMonthYear", () => {
  it("formats chart labels as MM/DD and MM/YYYY", () => {
    expect(formatShortDate("2026-08-29")).toBe("08/29");
    expect(formatMonthYear("2026-08-01")).toBe("08/2026");
  });
});

describe("formatRelativeDateTime", () => {
  it("formats recent times in spanish", () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60_000).toISOString();
    expect(formatRelativeDateTime(twoMinutesAgo, "es")).toBe("Hace 2 min");
  });

  it("formats recent times in english", () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60_000).toISOString();
    expect(formatRelativeDateTime(twoMinutesAgo, "en")).toBe("2 min ago");
  });

  it("formats older dates as MM/DD/YYYY", () => {
    const formatted = formatRelativeDateTime("2020-01-15T10:30:00.000Z", "es");
    expect(formatted).toMatch(/^01\/1[45]\/2020 /);
  });
});
