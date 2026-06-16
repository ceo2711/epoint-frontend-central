import { beforeEach, describe, expect, it } from "vitest";

import {
  clearToken,
  getRefreshToken,
  getToken,
  setSession,
  setToken,
} from "@/features/auth/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("stores and retrieves a token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("stores access and refresh tokens together", () => {
    setSession("access", "refresh");
    expect(getToken()).toBe("access");
    expect(getRefreshToken()).toBe("refresh");
  });

  it("clears the stored tokens", () => {
    setSession("access", "refresh");
    clearToken();
    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
