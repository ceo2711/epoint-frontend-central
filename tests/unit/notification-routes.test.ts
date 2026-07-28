import { describe, expect, it } from "vitest";

import { getNotificationHref, isNotificationNavigable } from "@/features/notifications/notification-routes";
import type { Notification } from "@/types/api";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 1,
    event_type: "CLIENT_APPROVED",
    channel: "IN_APP",
    title: "Test",
    body: "Body",
    payload: { client_id: 42 },
    read_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("getNotificationHref", () => {
  it("routes staff to client detail when client_id is present", () => {
    const href = getNotificationHref(makeNotification(), "ADMIN");
    expect(href).toBe("/clientes/42");
  });

  it("routes client document events to portal documents", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "DOCUMENT_REJECTED" }),
      "CLIENT",
    );
    expect(href).toBe("/portal/documentos");
  });

  it("routes client task events to portal board", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "TASK_COMMENTED" }),
      "CLIENT",
    );
    expect(href).toBe("/portal/tablero");
  });

  it("routes staff calendly events to calendar", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "CALENDLY_EVENT_SCHEDULED", payload: { calendly_event_id: 7 } }),
      "SALES_REP",
    );
    expect(href).toBe("/calendario");
  });

  it("routes staff payment events to pagos", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "PAYMENT_LINK_COMPLETED", payload: { payment_link_id: 3 } }),
      "SALES_REP",
    );
    expect(href).toBe("/pagos");
  });

  it("routes staff payment+conversion events to client detail", () => {
    const href = getNotificationHref(
      makeNotification({
        event_type: "PAYMENT_LINK_COMPLETED",
        payload: { payment_link_id: 3, prospect_id: 9, client_id: 42 },
      }),
      "SALES_REP",
    );
    expect(href).toBe("/clientes/42");
  });

  it("routes prospect conversion events to client detail", () => {
    const href = getNotificationHref(
      makeNotification({
        event_type: "PROSPECT_CONVERTED",
        payload: { prospect_id: 9, client_id: 42 },
      }),
      "SALES_REP",
    );
    expect(href).toBe("/clientes/42");
  });

  it("returns null for staff when no client_id", () => {
    const href = getNotificationHref(
      makeNotification({ payload: {} }),
      "ADMIN",
    );
    expect(href).toBeNull();
  });
});

describe("isNotificationNavigable", () => {
  it("is true when href exists", () => {
    expect(isNotificationNavigable(makeNotification(), "ADMIN")).toBe(true);
  });

  it("is false when href is null", () => {
    expect(isNotificationNavigable(makeNotification({ payload: {} }), "ADMIN")).toBe(false);
  });
});
