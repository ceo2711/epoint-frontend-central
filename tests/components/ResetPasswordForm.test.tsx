import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { api } from "@/lib/api";

vi.mock("@/contexts/LanguageContext", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: "es",
  }),
}));

vi.mock("@/components/ui/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn() },
}));

function passwordField(testId: "new-password" | "confirm-password") {
  const field = document.getElementById(testId);
  if (!field) {
    throw new Error(`No se encontró el campo ${testId}`);
  }
  return field;
}

describe("ResetPasswordForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("pide la clave nueva y que se repita", () => {
    render(
      <ThemeProvider>
        <ResetPasswordForm token="reset-token-value-1234567890" />
      </ThemeProvider>,
    );

    expect(passwordField("new-password")).toBeInTheDocument();
    expect(passwordField("confirm-password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "resetPassword.submit" })).toBeInTheDocument();
  });

  it("no envía si las claves no coinciden", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ message: "ok" });

    render(
      <ThemeProvider>
        <ResetPasswordForm token="reset-token-value-1234567890" />
      </ThemeProvider>,
    );

    await user.type(passwordField("new-password"), "NuevaClave12");
    await user.type(passwordField("confirm-password"), "OtraClave12");
    await user.click(screen.getByRole("button", { name: "resetPassword.submit" }));

    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getAllByText("resetPassword.mismatch").length).toBeGreaterThan(0);
  });

  it("envía la clave nueva cuando coinciden", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ message: "ok" });

    render(
      <ThemeProvider>
        <ResetPasswordForm token="reset-token-value-1234567890" />
      </ThemeProvider>,
    );

    await user.type(passwordField("new-password"), "NuevaClave12");
    await user.type(passwordField("confirm-password"), "NuevaClave12");
    await user.click(screen.getByRole("button", { name: "resetPassword.submit" }));

    expect(api.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "reset-token-value-1234567890",
      new_password: "NuevaClave12",
    });
    expect(await screen.findByText("resetPassword.success")).toBeInTheDocument();
  });
});
