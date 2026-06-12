import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

/** Path prefixes reachable without a session. */
const PUBLIC_PREFIXES = ["/login", "/auth", "/api", "/offline"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** Build a redirect that preserves any refreshed auth cookies. */
function redirectTo(
  request: NextRequest,
  pathname: string,
  carry?: NextResponse,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const res = NextResponse.redirect(url);
  carry?.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

/**
 * Route guard. Uses real Supabase auth when configured (refreshing the session
 * first so rotated tokens persist), else the stub session cookie.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSupabaseConfigured()) {
    const { response, authenticated } = await updateSession(request);
    if (!authenticated && !isPublic(pathname)) return redirectTo(request, "/login", response);
    if (authenticated && pathname === "/login") return redirectTo(request, "/", response);
    return response;
  }

  // Fallback: stub session cookie.
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession && !isPublic(pathname)) return redirectTo(request, "/login");
  if (hasSession && pathname === "/login") return redirectTo(request, "/");
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
