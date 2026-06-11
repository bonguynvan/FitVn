"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/auth/session";
// import { createClient } from "@/lib/supabase/server"; // TODO(auth): real auth
// import { headers } from "next/headers";

/**
 * Auth server actions.
 *
 * The Supabase email + Google logic is fully written but COMMENTED — the app
 * currently runs on a temporary stub session (an httpOnly cookie) so the flow
 * is testable without a backend. To go live: set the Supabase env vars and
 * uncomment the marked blocks (and remove the `// TEMP` stubs).
 */

export interface AuthResult {
  error?: string;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Email + password sign-in (used by the /login form via useFormState). */
export async function login(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Email không hợp lệ." };
  }

  // --- Supabase email auth (integrate later) --------------------------------
  // const supabase = await createClient();
  // const { error } = await supabase.auth.signInWithPassword({ email, password });
  // if (error) return { error: "Email hoặc mật khẩu không đúng." };
  // --------------------------------------------------------------------------

  // TEMP: accept any credentials and store a stub session.
  cookies().set(SESSION_COOKIE, email, COOKIE_OPTIONS);
  redirect("/");
}

/** Email + password sign-up. */
export async function signUp(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Email không hợp lệ." };
  if (password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  // --- Supabase sign-up (integrate later) -----------------------------------
  // const supabase = await createClient();
  // const { error } = await supabase.auth.signUp({ email, password });
  // if (error) return { error: error.message };
  // --------------------------------------------------------------------------

  // TEMP: create the stub session immediately.
  cookies().set(SESSION_COOKIE, email, COOKIE_OPTIONS);
  redirect("/");
}

/** Google OAuth sign-in. Written for Supabase; not enabled in the temp phase. */
export async function loginWithGoogle(): Promise<AuthResult> {
  // --- Supabase Google OAuth (integrate later) ------------------------------
  // const supabase = await createClient();
  // const origin = headers().get("origin") ?? "";
  // const { data, error } = await supabase.auth.signInWithOAuth({
  //   provider: "google",
  //   options: { redirectTo: `${origin}/auth/callback` },
  // });
  // if (error) return { error: "Không thể đăng nhập với Google." };
  // if (data.url) redirect(data.url);
  // --------------------------------------------------------------------------

  // TEMP: Google is not wired up yet — guide the user to email sign-in.
  return {
    error: "Đăng nhập Google sẽ sớm được hỗ trợ. Hãy dùng email để tiếp tục.",
  };
}

/** Sign out and return to the login screen. */
export async function logout(): Promise<void> {
  // --- Supabase (integrate later) -------------------------------------------
  // const supabase = await createClient();
  // await supabase.auth.signOut();
  // --------------------------------------------------------------------------

  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
