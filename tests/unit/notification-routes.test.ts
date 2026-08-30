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
    expect(href).toBe("/clientes/42?n=1");
  });

  it("routes client document events to portal documents", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "DOCUMENT_REJECTED" }),
      "CLIENT",
    );
    expect(href).toBe("/portal/documentos?n=1");
  });

  it("routes client task events to portal board", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "TASK_COMMENTED" }),
      "CLIENT",
    );
    expect(href).toBe("/portal/tablero?n=1");
  });

  it("routes staff board mentions to the client card", () => {
    const href = getNotificationHref(
      makeNotification({
        event_type: "TASK_COMMENTED",
        payload: { client_id: 42, card_id: 7 },
      }),
      "ADVISOR",
    );
    expect(href).toBe("/clientes/42?tab=board&card=7&n=1");
  });

  it("routes client board mentions to the portal card", () => {
    const href = getNotificationHref(
      makeNotification({
        event_type: "TASK_COMMENTED",
        payload: { client_id: 42, card_id: 7 },
      }),
      "CLIENT",
    );
    expect(href).toBe("/portal/tablero?card=7&n=1");
  });

  it("routes rejected board attachments to the same card with a unique notice id", () => {
    const href = getNotificationHref(
      makeNotification({
        id: 9,
        event_type: "BOARD_ATTACHMENT_REJECTED",
        payload: { client_id: 42, card_id: 7, attachment_id: 15 },
      }),
      "CLIENT",
    );
    expect(href).toBe("/portal/tablero?card=7&n=9&attachment=15");
  });

  it("routes staff calendly events to calendar", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "CALENDLY_EVENT_SCHEDULED", payload: { calendly_event_id: 7 } }),
      "SALES_REP",
    );
    expect(href).toBe("/calendario?n=1");
  });

  it("routes staff payment events to pagos", () => {
    const href = getNotificationHref(
      makeNotification({ event_type: "PAYMENT_LINK_COMPLETED", payload: { payment_link_id: 3 } }),
      "SALES_REP",
    );
    expect(href).toBe("/pagos?n=1");
  });

  it("routes staff payment+conversion events to client detail", () => {
    const href = getNotificationHref(
      makeNotification({
        event_type: "PAYMENT_LINK_COMPLETED",
        payload: { payment_link_id: 3, prospect_id: 9, client_id: 42 },
      }),
      "SALES_REP",
    );
    expect(href).toBe("/clientes/42?n=1");
  });

  it("routes inbound client email to the client thread", () => {
    const href = getNotificationHref(
      makeNotification({
        event_type: "CLIENT_EMAIL_RECEIVED",
        payload: { client_id: 42, email_id: 9 },
      }),
      "ADVISOR",
    );
    expect(href).toBe("/clientes/42?email=1&n=1");
  });

  it("routes prospect conversion events to client detail", () => {
    const href = getNotificationHref(
      makeNotification({
        event_type: "PROSPECT_CONVERTED",
        payload: { prospect_id: 9, client_id: 42 },
      }),
      "SALES_REP",
    );
    expect(href).toBe("/clientes/42?n=1");
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
