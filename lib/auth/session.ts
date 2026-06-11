import { cookies } from "next/headers";
// import { createClient } from "@/lib/supabase/server"; // TODO(auth): real auth

/**
 * Session helper.
 *
 * TEMPORARY implementation: a stub session is stored in an httpOnly cookie so
 * the whole app flow (login → gated routes → logout) works without a backend.
 * The real Supabase auth is written below but commented — uncomment it (and set
 * the NEXT_PUBLIC_SUPABASE_* env vars) to integrate, then delete the stub.
 */

export const SESSION_COOKIE = "fitvn-session";

export interface SessionUser {
  email: string;
  /** Display name derived from the email local part. */
  name: string;
}

export function nameFromEmail(email: string): string {
  const local = (email.split("@")[0] || "bạn").replace(/[._-]+/g, " ").trim();
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Returns the signed-in user, or null. Use in Server Components / actions. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // --- Supabase (integrate later) -------------------------------------------
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user?.email) return null;
  // return {
  //   email: user.email,
  //   name: user.user_metadata?.full_name ?? nameFromEmail(user.email),
  // };
  // --------------------------------------------------------------------------

  // TEMP: read the stub session cookie.
  const email = cookies().get(SESSION_COOKIE)?.value;
  if (!email) return null;
  return { email, name: nameFromEmail(email) };
}
