import { NextResponse, type NextRequest } from "next/server";
// import { createClient } from "@/lib/supabase/server"; // TODO(auth): real auth

/**
 * OAuth callback (Google). Wired for Supabase but commented until integration.
 * Supabase redirects here with a `code`; we exchange it for a session, then
 * forward to the app.
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/";

  // --- Supabase code exchange (integrate later) -----------------------------
  // const code = request.nextUrl.searchParams.get("code");
  // if (code) {
  //   const supabase = await createClient();
  //   await supabase.auth.exchangeCodeForSession(code);
  // }
  // --------------------------------------------------------------------------

  return NextResponse.redirect(new URL(next, request.url));
}
