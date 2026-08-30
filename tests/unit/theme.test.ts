import { describe, expect, it } from "vitest";

import { resolveTheme, THEME_STORAGE_KEY } from "@/contexts/ThemeContext";

describe("theme", () => {
  it("defaults to light when the value is missing or invalid", () => {
    expect(resolveTheme(null)).toBe("light");
    expect(resolveTheme(undefined)).toBe("light");
    expect(resolveTheme("blue")).toBe("light");
  });

  it("accepts an explicit dark or light value", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("persists the theme under a stable storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("epoint-crm-theme");
  });
});
