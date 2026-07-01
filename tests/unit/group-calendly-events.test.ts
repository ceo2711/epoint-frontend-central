import { describe, expect, it } from "vitest";

import {
  extractEventDay,
  extractEventTime,
  groupCalendlyEventsByDay,
} from "@/features/chat/utils/groupCalendlyEvents";

describe("groupCalendlyEventsByDay", () => {
  it("agrupa y ordena por día", () => {
    const groups = groupCalendlyEventsByDay([
      { id: 2, start_label: "02/07/2026 09:00", name: "B" },
      { id: 1, start_label: "01/07/2026 09:30", name: "A" },
      { id: 3, start_label: "01/07/2026 14:00", name: "C" },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].dayKey).toBe("01/07/2026");
    expect(groups[0].events.map((e) => e.id)).toEqual([1, 3]);
    expect(groups[1].dayKey).toBe("02/07/2026");
  });

  it("extrae día y hora del start_label", () => {
    expect(extractEventDay("15/06/2026 14:30")).toBe("15/06/2026");
    expect(extractEventTime("15/06/2026 14:30")).toBe("14:30");
  });
});
