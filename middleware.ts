import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isKnownAppPath } from "@/lib/app-routes";

/**
 * Cortafuegos de rutas: URLs desconocidas redirigen a "/" y desde ahí
 * el cliente envía a login (sin sesión) o al dashboard/portal (con sesión).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isKnownAppPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
