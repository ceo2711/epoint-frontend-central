import type { Notification } from "@/types/api";

const BOARD_EVENT_TYPES = new Set([
  "TASK_COMMENTED",
  "TASK_COMPLETED",
  "BOARD_ATTACHMENT_REJECTED",
]);

export function payloadPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function boardHref(payload: Notification["payload"], isClient: boolean): string | null {
  const clientId = payloadPositiveInt(payload?.client_id);
  const cardId = payloadPositiveInt(payload?.card_id);
  if (isClient) {
    return cardId ? `/portal/tablero?card=${cardId}` : "/portal/tablero";
  }
  if (!clientId) return null;
  const params = new URLSearchParams({ tab: "board" });
  if (cardId) params.set("card", String(cardId));
  return `/clientes/${clientId}?${params.toString()}`;
}

/** Resuelve la ruta interna según el tipo de notificación y el rol del usuario. */
export function getNotificationHref(
  notification: Notification,
  roleCode: string | undefined,
): string | null {
  const payload = notification.payload;
  const isClient = roleCode === "CLIENT";
  const clientId = payloadPositiveInt(payload?.client_id);

  if (BOARD_EVENT_TYPES.has(notification.event_type)) {
    return boardHref(payload, isClient);
  }

  if (notification.event_type === "CALENDLY_EVENT_SCHEDULED" && !isClient) {
    return "/calendario";
  }

  if (notification.event_type === "DOCUSIGN_ENVELOPE_COMPLETED" && !isClient) {
    if (clientId) return `/clientes/${clientId}`;
    return "/contratos";
  }

  if (notification.event_type === "PAYMENT_LINK_COMPLETED" && !isClient) {
    if (clientId) return `/clientes/${clientId}`;
    const prospectId = payloadPositiveInt(payload?.prospect_id);
    if (prospectId) return `/prospectos/${prospectId}`;
    return "/pagos";
  }

  if (notification.event_type === "PROSPECT_CONVERTED" && !isClient) {
    if (clientId) return `/clientes/${clientId}`;
    const prospectId = payloadPositiveInt(payload?.prospect_id);
    if (prospectId) return `/prospectos/${prospectId}`;
    return "/prospectos";
  }

  if (clientId) {
    if (isClient) {
      switch (notification.event_type) {
        case "DOCUMENT_REJECTED":
        case "DOCUMENT_EXPIRING_SOON":
          return "/portal/documentos";
        case "CLIENT_APPROVED":
        case "CLIENT_DATA_COMPLETE":
        default:
          return "/portal/datos";
      }
    }
    return `/clientes/${clientId}`;
  }

  if (isClient) {
    switch (notification.event_type) {
      case "DOCUMENT_REJECTED":
      case "DOCUMENT_EXPIRING_SOON":
        return "/portal/documentos";
      default:
        return null;
    }
  }

  return null;
}

export function isNotificationNavigable(notification: Notification, roleCode: string | undefined): boolean {
  return getNotificationHref(notification, roleCode) !== null;
}
