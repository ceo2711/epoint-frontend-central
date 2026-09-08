/** URL base de la API — solo para uso interno del cliente, nunca mostrar al usuario. */
export function normalizeApiBaseUrl(url: string): string {
  // En Windows, Chrome resuelve `localhost` a IPv6 (::1) y uvicorn suele
  // escuchar solo en IPv4 → TypeError: Failed to fetch.
  return url.replace("://localhost", "://127.0.0.1");
}

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  );
}
