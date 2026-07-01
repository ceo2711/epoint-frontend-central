/** Rutas conocidas de la app (sincronizar al agregar páginas nuevas). */
const KNOWN_PATH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/login$/,
  /^\/verificar-2fa$/,
  /^\/recuperar-contrasena$/,
  /^\/recuperar-contrasena\/confirmar$/,
  /^\/cambiar-contrasena$/,
  /^\/dashboard$/,
  /^\/clientes$/,
  /^\/clientes\/\d+$/,
  /^\/calendario$/,
  /^\/contratos$/,
  /^\/configuracion$/,
  /^\/comercios$/,
  /^\/usuarios$/,
  /^\/roles$/,
  /^\/areas$/,
  /^\/portal$/,
  /^\/portal\/datos$/,
  /^\/portal\/documentos$/,
  /^\/portal\/tablero$/,
  /^\/portal\/cuenta$/,
];

export function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || "/";
}

export function isKnownAppPath(pathname: string): boolean {
  return KNOWN_PATH_PATTERNS.some((pattern) => pattern.test(normalizePathname(pathname)));
}
