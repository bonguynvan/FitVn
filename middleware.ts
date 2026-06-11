import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /*
   * Run on all paths EXCEPT:
   * - Next.js internals (_next/static, _next/image)
   * - favicon and common static image/asset extensions
   * - PWA artifacts (manifest, service worker, workbox runtime)
   * This keeps session refresh off cacheable static requests.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf)$).*)",
  ],
};
