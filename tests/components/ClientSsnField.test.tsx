import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ClientSsnField } from "@/features/clients/components/ClientSsnField";

vi.mock("@/contexts/LanguageContext", () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: "es" }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({ ssn: "123-45-6789" }),
  },
}));

vi.mock("@/lib/clipboard", () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe("ClientSsnField", () => {
  it("shows No when the client has no SSN", () => {
    render(<ClientSsnField clientId={1} hasSsn={false} token="tok" />);

    expect(screen.getByText("common.no")).toBeInTheDocument();
    expect(screen.queryByLabelText("clientDetail.showSsn")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("clientDetail.copySsn")).not.toBeInTheDocument();
  });

  it("copies the SSN without 2FA and keeps it masked", async () => {
    const user = userEvent.setup();
    const { copyToClipboard } = await import("@/lib/clipboard");
    const { api } = await import("@/lib/api");

    render(<ClientSsnField clientId={7} hasSsn token="tok" />);

    expect(screen.getByText("***-**-****")).toBeInTheDocument();
    expect(screen.getByLabelText("clientDetail.showSsn")).toBeInTheDocument();

    await user.click(screen.getByLabelText("clientDetail.copySsn"));

    expect(api.get).toHaveBeenCalledWith("/clients/7/ssn", "tok");
    expect(copyToClipboard).toHaveBeenCalledWith("123-45-6789");
    expect(screen.getByText("***-**-****")).toBeInTheDocument();
  });
});
