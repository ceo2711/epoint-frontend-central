import { describe, expect, it, vi } from "vitest";

import { setupNotificationSoundUnlock } from "@/features/notifications/notificationSound";

describe("notificationSound", () => {
  it("registers global unlock listeners", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const cleanup = setupNotificationSoundUnlock();
    expect(addSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function), { capture: true });
    expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function), { capture: true });
    cleanup();
    expect(removeSpy).toHaveBeenCalled();
  });
});
