import { beforeEach, describe, expect, it } from "vitest";

import { clearToken, getToken, setToken } from "@/features/auth/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("stores and retrieves a token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("clears the stored token", () => {
    setToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
