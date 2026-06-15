import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/components/LoginForm";

vi.mock("@/contexts/LanguageContext", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: "es",
  }),
}));

vi.mock("@/components/ui/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders email and password fields", () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("login.emailLabel")).toBeInTheDocument();
    expect(screen.getByLabelText("login.passwordLabel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "login.submit" })).toBeInTheDocument();
  });

  it("calls onSubmit with trimmed credentials", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { container } = render(<LoginForm onSubmit={onSubmit} />);
    const form = container.querySelector("form")!;

    await user.type(screen.getByLabelText("login.emailLabel"), "  Admin@Test.com  ");
    await user.type(screen.getByLabelText("login.passwordLabel"), "  secret12  ");
    await user.click(within(form).getByRole("button", { name: "login.submit" }));

    expect(onSubmit).toHaveBeenCalledWith("admin@test.com", "secret12");
  });
});
