import { describe, expect, it } from "vitest";

import { displayColumnTitle } from "@/features/boards/utils/displayColumnTitle";
import { translate } from "@/i18n";

describe("displayColumnTitle", () => {
  it("translates canonical column titles to English", () => {
    const t = (key: string) => translate("en", key);
    expect(displayColumnTitle("Credenciales", t)).toBe("Credentials");
    expect(displayColumnTitle("Client TO DO", t)).toBe("Client TO DO");
    expect(displayColumnTitle("Ideas a realizar", t)).toBe("Ideas to complete");
    expect(displayColumnTitle("Seguimiento extra", t)).toBe("Seguimiento extra");
  });

  it("translates canonical column titles to Spanish", () => {
    const t = (key: string) => translate("es", key);
    expect(displayColumnTitle("Client TO DO", t)).toBe("Tareas del cliente");
    expect(displayColumnTitle("Credentials", t)).toBe("Credenciales");
    expect(displayColumnTitle("Completed", t)).toBe("Completado");
  });
});
