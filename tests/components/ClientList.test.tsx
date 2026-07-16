import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClientList } from "@/features/clients/components/ClientList";
import type { Client } from "@/features/clients/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

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
  source: "WEB",
  merchant: null,
  registered_by_user_id: 1,
  registered_by: {
    id: 1,
    first_name: "Ana",
    last_name: "Vendedora",
    email: "ana@epoint.com",
  },
  created_at: new Date().toISOString(),
};

const pagination = {
  page: 1,
  pages: 1,
  total: 1,
  pageSize: 10,
  onPageChange: vi.fn(),
};

describe("ClientList", () => {
  it("renders client name and email", () => {
    render(<ClientList clients={[sampleClient]} {...pagination} />);

    expect(screen.getAllByText("Juan Pérez").length).toBeGreaterThan(0);
    expect(screen.getAllByText("juan@test.com").length).toBeGreaterThan(0);
  });

  it("shows sales rep column for admin", () => {
    render(
      <ClientList clients={[sampleClient]} showSalesRepColumn {...pagination} />,
    );

    expect(screen.getAllByText("prospects.columns.salesRep").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ana Vendedora").length).toBeGreaterThan(0);
  });
});
