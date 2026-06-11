"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getExistingSubscription,
  getNotificationPermission,
  isPushSupported,
  serializeSubscription,
  subscribeUser,
  unsubscribeUser,
} from "@/lib/push/client";

/**
 * PushManager — mobile-first notification opt-in card.
 *
 * Shows the current permission state, a Subscribe / Unsubscribe action, and the
 * iOS caveat (push only works in an installed PWA on iOS 16.4+). Posts the
 * subscription to /api/push/subscribe and removes it via /api/push/unsubscribe.
 */

type Status =
  | "loading"
  | "unsupported"
  | "ios-needs-install"
  | "denied"
  | "subscribed"
  | "unsubscribed";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Detect iOS Safari that is NOT running as an installed standalone PWA. */
function isIosWithoutStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  // iOS exposes navigator.standalone; Android/desktop use display-mode.
  const standalone =
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !standalone;
}

export function PushManager() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) {
      setStatus(isIosWithoutStandalone() ? "ios-needs-install" : "unsupported");
      return;
    }
    const permission = getNotificationPermission();
    if (permission === "denied") {
      setStatus("denied");
      return;
    }
    const existing = await getExistingSubscription();
    setStatus(existing ? "subscribed" : "unsubscribed");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const subscription = await subscribeUser({
        vapidPublicKey: VAPID_PUBLIC_KEY,
      });
      const payload = serializeSubscription(subscription);

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Không lưu được đăng ký thông báo.");
      }
      setStatus("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const handleUnsubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { endpoint, removed } = await unsubscribeUser();
      if (endpoint) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      if (!removed && endpoint) {
        // Browser kept the subscription but we removed the server row; treat as
        // unsubscribed from the user's perspective.
      }
      setStatus("unsubscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <header className="mb-3 flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-primary/12 text-primary"
        >
          <BellIcon />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">
            Nhắc nhở tập luyện
          </h2>
          <p className="text-sm text-muted">
            Nhận thông báo nhắc lịch tập và uống nước.
          </p>
        </div>
      </header>

      <StatusBody
        status={status}
        busy={busy}
        onSubscribe={handleSubscribe}
        onUnsubscribe={handleUnsubscribe}
      />

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

function StatusBody({
  status,
  busy,
  onSubscribe,
  onUnsubscribe,
}: {
  status: Status;
  busy: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
}) {
  switch (status) {
    case "loading":
      return (
        <div className="h-11 animate-pulse rounded-pill bg-surface-raised" />
      );

    case "unsupported":
      return (
        <Hint tone="muted">
          Trình duyệt này chưa hỗ trợ thông báo đẩy. Hãy thử Chrome hoặc Safari
          mới nhất.
        </Hint>
      );

    case "ios-needs-install":
      return (
        <Hint tone="muted">
          Trên iPhone/iPad, thông báo chỉ hoạt động khi bạn{" "}
          <strong className="font-semibold text-text">
            thêm FitVN vào Màn hình chính
          </strong>{" "}
          (cần iOS 16.4 trở lên). Mở từ icon đã cài rồi bật lại thông báo.
        </Hint>
      );

    case "denied":
      return (
        <Hint tone="danger">
          Thông báo đang bị chặn. Hãy vào cài đặt trình duyệt và cho phép thông
          báo cho FitVN, sau đó tải lại trang.
        </Hint>
      );

    case "subscribed":
      return (
        <div className="space-y-3">
          <Hint tone="success">Đã bật thông báo trên thiết bị này.</Hint>
          <button
            type="button"
            onClick={onUnsubscribe}
            disabled={busy}
            className="w-full rounded-pill border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition active:scale-95 disabled:opacity-60"
          >
            {busy ? "Đang tắt…" : "Tắt thông báo"}
          </button>
        </div>
      );

    case "unsubscribed":
    default:
      return (
        <button
          type="button"
          onClick={onSubscribe}
          disabled={busy}
          className="w-full rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-primary-fg shadow-glow transition active:scale-95 disabled:opacity-60"
        >
          {busy ? "Đang bật…" : "Bật thông báo"}
        </button>
      );
  }
}

function Hint({
  tone,
  children,
}: {
  tone: "muted" | "success" | "danger";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "danger"
        ? "bg-danger/10 text-danger"
        : "bg-surface-raised text-muted";
  return (
    <p className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${toneClass}`}>
      {children}
    </p>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
