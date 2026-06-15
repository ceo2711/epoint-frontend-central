import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskBoard } from "@/features/boards/components/TaskBoard";
import type { Board } from "@/features/boards/types";

vi.mock("@/contexts/LanguageContext", () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: "es" }),
}));

const board: Board = {
  id: 1,
  client_id: 10,
  template_code: "DEFAULT",
  lists: [
    {
      id: 1,
      title: "Pendientes",
      position: 0,
      cards: [
        {
          id: 100,
          title: "Subir DNI",
          description_md: null,
          instructions_md: null,
          external_links: null,
          status: "PENDIENTE",
          position: 0,
          requires_credentials: false,
          requires_file_upload: false,
          client_result_text: null,
          has_credentials: false,
          comments: [],
          attachments: [],
        },
      ],
    },
  ],
};

describe("TaskBoard", () => {
  it("renders list title and card", () => {
    render(<TaskBoard board={board} onSelectCard={() => {}} />);
    expect(screen.getByText("Pendientes")).toBeInTheDocument();
    expect(screen.getByText("Subir DNI")).toBeInTheDocument();
  });
});
