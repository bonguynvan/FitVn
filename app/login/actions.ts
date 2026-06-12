"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Auth server actions.
 *
 * Use real Supabase auth (email/password + Google) when configured, else a
 * temporary stub httpOnly-cookie session so the app runs without a backend.
 */

export interface AuthResult {
  error?: string;
  /** Non-error message (e.g. "check your email to confirm"). */
  notice?: string;
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

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Email hoặc mật khẩu không đúng." };
    redirect("/");
  }

  // Fallback: accept any credentials and store a stub session.
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

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = /already registered/i.test(error.message)
        ? "Email này đã được đăng ký. Hãy đăng nhập."
        : "Không tạo được tài khoản. Vui lòng thử lại.";
      return { error: msg };
    }
    // When email confirmation is on, no session is returned yet.
    if (!data.session) {
      return { notice: "Đã gửi email xác nhận. Kiểm tra hộp thư rồi đăng nhập." };
    }
    redirect("/");
  }

  // Fallback: create the stub session immediately.
  cookies().set(SESSION_COOKIE, email, COOKIE_OPTIONS);
  redirect("/");
}

/** Google OAuth sign-in. Written for Supabase; not enabled in the temp phase. */
export async function loginWithGoogle(): Promise<AuthResult> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const origin = headers().get("origin") ?? "";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) return { error: "Không thể đăng nhập với Google." };
    if (data.url) redirect(data.url);
    return {};
  }

  // Fallback: Google needs Supabase — guide the user to email sign-in.
  return {
    error: "Đăng nhập Google cần cấu hình Supabase. Hãy dùng email để tiếp tục.",
  };
}

/** Sign out and return to the login screen. */
export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
