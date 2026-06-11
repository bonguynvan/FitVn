"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Dumbbell } from "lucide-react";

import { login, signUp, loginWithGoogle, type AuthResult } from "./actions";

type Mode = "login" | "signup";

const EMPTY: AuthResult = {};

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginAction] = useFormState(login, EMPTY);
  const [signupState, signupAction] = useFormState(signUp, EMPTY);

  const isLogin = mode === "login";
  const action = isLogin ? loginAction : signupAction;
  const error = (isLogin ? loginState : signupState).error;

  return (
    <main className="flex min-h-dvh flex-1 flex-col justify-center gap-8 px-6 py-10 pt-safe">
      {/* Brand */}
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-card bg-primary text-primary-fg shadow-glow">
          <Dumbbell size={30} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-text">FitVN</h1>
          <p className="mt-1 text-sm text-muted">
            Tập luyện & dinh dưỡng cho người Việt
          </p>
        </div>
      </header>

      {/* Auth card */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        {/* Mode toggle */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-btn bg-surface-raised p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-[0.5rem] py-2 text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-surface text-text shadow-card"
                  : "text-muted hover:text-text"
              }`}
            >
              {m === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <form action={action} className="flex flex-col gap-4">
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            inputMode="email"
          />
          <Field
            label="Mật khẩu"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="••••••••"
          />

          {error ? (
            <p
              role="alert"
              className="rounded-btn bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <SubmitButton
            label={isLogin ? "Đăng nhập" : "Tạo tài khoản"}
            pendingLabel={isLogin ? "Đang đăng nhập…" : "Đang tạo…"}
          />
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          hoặc
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton />

        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Đăng nhập tạm thời để trải nghiệm — chỉ cần email và mật khẩu bất kỳ.
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "email" | "text";
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-text">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        // text-base (16px) prevents the iOS focus-zoom jump.
        className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none transition-colors placeholder:text-muted focus:border-primary"
      />
    </label>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex h-12 items-center justify-center rounded-btn bg-primary px-5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function GoogleButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onGoogle() {
    setMessage(null);
    startTransition(async () => {
      const result = await loginWithGoogle();
      if (result?.error) setMessage(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onGoogle}
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2.5 rounded-btn border border-border bg-surface px-5 text-sm font-semibold text-text transition-colors hover:border-primary/50 active:scale-[0.98] disabled:opacity-60"
      >
        <GoogleIcon />
        Tiếp tục với Google
      </button>
      {message ? (
        <p className="text-center text-xs text-muted">{message}</p>
      ) : null}
    </div>
  );
}

/** Official multi-color Google "G". */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
