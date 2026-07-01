/**
 * Calendly Scheduling API (crear / editar / cancelar) requiere plan de pago en Calendly.
 * Mientras sea false, la UI solo permite ver y sincronizar.
 * Para reactivar: NEXT_PUBLIC_CALENDLY_WRITE_ENABLED=true
 */
export const CALENDLY_WRITE_ENABLED =
  process.env.NEXT_PUBLIC_CALENDLY_WRITE_ENABLED === "true";
