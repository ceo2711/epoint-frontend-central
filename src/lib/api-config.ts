/** URL base de la API — solo para uso interno del cliente, nunca mostrar al usuario. */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
}
