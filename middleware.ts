import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";
// import { updateSession } from "@/lib/supabase/middleware"; // TODO(auth): real session refresh

/** Path prefixes reachable without a session. */
const PUBLIC_PREFIXES = ["/login", "/auth", "/api", "/offline"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Route guard.
 *
 * TEMPORARY: gates on the stub session cookie (see lib/auth/session.ts). When
 * Supabase auth is integrated, refresh the session first via updateSession and
 * gate on the real user (the commented block shows where).
 */
export async function middleware(request: NextRequest) {
  // --- Supabase session refresh (integrate later) ---------------------------
  // return updateSession(request); // refreshes auth cookies on every request
  // --------------------------------------------------------------------------

  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // Unauthenticated visitor on a protected route → send to /login.
  if (!hasSession && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Signed-in visitor on /login → go home.
  if (hasSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Run on all paths EXCEPT Next internals, favicon, static image/asset
   * extensions, and PWA artifacts (manifest, service worker, workbox runtime).
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf)$).*)",
  ],
};
