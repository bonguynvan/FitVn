import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Session helper.
 *
 * Uses real Supabase auth when configured (NEXT_PUBLIC_SUPABASE_* set); falls
 * back to a stub httpOnly-cookie session otherwise so the app still runs
 * end-to-end without a backend.
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
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    return {
      email: user.email,
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        nameFromEmail(user.email),
    };
  }

  // Fallback: read the stub session cookie.
  const email = cookies().get(SESSION_COOKIE)?.value;
  if (!email) return null;
  return { email, name: nameFromEmail(email) };
}
