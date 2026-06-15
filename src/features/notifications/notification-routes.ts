import type { Notification } from "@/types/api";

/** Resuelve la ruta interna según el tipo de notificación y el rol del usuario. */
export function getNotificationHref(
  notification: Notification,
  roleCode: string | undefined,
): string | null {
  const payload = notification.payload;
  const isClient = roleCode === "CLIENT";
  const clientId = payload?.client_id;

  if (clientId) {
    if (isClient) {
      switch (notification.event_type) {
        case "DOCUMENT_REJECTED":
        case "DOCUMENT_EXPIRING_SOON":
          return "/portal/documentos";
        case "TASK_COMPLETED":
        case "TASK_COMMENTED":
          return "/portal/tablero";
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
      case "TASK_COMPLETED":
      case "TASK_COMMENTED":
        return "/portal/tablero";
      default:
        return null;
    }
  }

  return null;
}

export function isNotificationNavigable(notification: Notification, roleCode: string | undefined): boolean {
  return getNotificationHref(notification, roleCode) !== null;
}
