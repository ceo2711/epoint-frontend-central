import { describe, expect, it } from "vitest";

import {
  extractEventDay,
  extractEventTime,
  groupCalendlyEventsByDay,
} from "@/features/chat/utils/groupCalendlyEvents";

describe("groupCalendlyEventsByDay", () => {
  it("agrupa y ordena por día", () => {
    const groups = groupCalendlyEventsByDay([
      { id: 2, start_label: "07/02/2026 9:00 AM", name: "B" },
      { id: 1, start_label: "07/01/2026 9:30 AM", name: "A" },
      { id: 3, start_label: "07/01/2026 2:00 PM", name: "C" },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].dayKey).toBe("07/01/2026");
    expect(groups[0].events.map((e) => e.id)).toEqual([1, 3]);
    expect(groups[1].dayKey).toBe("07/02/2026");
  });

  it("extrae día y hora del start_label", () => {
    expect(extractEventDay("06/15/2026 2:30 PM")).toBe("06/15/2026");
    expect(extractEventTime("06/15/2026 2:30 PM")).toBe("2:30 PM");
  });
});
