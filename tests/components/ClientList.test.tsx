import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClientList } from "@/features/clients/components/ClientList";
import type { Client } from "@/features/clients/types";

vi.mock("@/contexts/LanguageContext", () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: "es" }),
}));

const sampleClient: Client = {
  id: 1,
  status: "PENDIENTE_DE_REVISION",
  first_name: "Juan",
  last_name: "Pérez",
  email: "juan@test.com",
  phone: "1131432490",
  rejection_reason: null,
  rejected_at: null,
  approved_at: null,
  date_of_birth: null,
  has_ssn: false,
  registered_by_user_id: 1,
  created_at: new Date().toISOString(),
};

describe("ClientList", () => {
  it("renders client name and email", () => {
    render(
      <ClientList
        clients={[sampleClient]}
        canApprove={false}
        canUpdate={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onResubmit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Juan Pérez").length).toBeGreaterThan(0);
    expect(screen.getAllByText("juan@test.com").length).toBeGreaterThan(0);
  });

  it("shows approve buttons when permitted", () => {
    render(
      <ClientList
        clients={[sampleClient]}
        canApprove
        canUpdate={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onResubmit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("clients.approve").length).toBeGreaterThan(0);
    expect(screen.getAllByText("clients.reject").length).toBeGreaterThan(0);
  });
});
