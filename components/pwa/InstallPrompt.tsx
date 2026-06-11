"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * InstallPrompt — custom "Cài đặt FitVN" affordance.
 *
 * Android/Chrome: captures the `beforeinstallprompt` event and shows a branded
 * Install button that calls `prompt()`.
 *
 * iOS Safari: there is no `beforeinstallprompt`, so we show manual
 * "Thêm vào Màn hình chính" instructions (Share → Add to Home Screen).
 *
 * Hidden entirely when already installed (standalone). Dismissal is remembered
 * in localStorage so we don't nag on every visit.
 */

const DISMISS_KEY = "fitvn:install-dismissed";

/** Chrome's non-standard beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

type Mode = "hidden" | "android" | "ios";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPadOS 13+ reports as Mac; treat touch-capable Mac Safari as iOS too.
  const iOsUa = /iphone|ipad|ipod/i.test(ua);
  const iPadOs =
    ua.includes("Macintosh") && "ontouchend" in window.document;
  return iOsUa || iPadOs;
}

function wasDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandalone() || wasDismissed()) {
      setMode("hidden");
      return;
    }

    // iOS has no beforeinstallprompt — show manual instructions immediately.
    if (isIos()) {
      setMode("ios");
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // stop the mini-infobar; we render our own UI
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };

    const onInstalled = () => {
      setMode("hidden");
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage may be unavailable (private mode); dismissing this session
      // is still fine.
    }
    setMode("hidden");
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      setMode("hidden");
    } else {
      dismiss();
    }
  }, [deferred, dismiss]);

  if (mode === "hidden") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-safe">
      <div className="mx-auto mb-4 w-full max-w-app overflow-hidden rounded-card bg-surface shadow-card">
        <div className="flex items-start gap-3 p-4">
          <span
            aria-hidden
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-primary text-primary-fg shadow-glow"
          >
            <DownloadIcon />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-text">Cài đặt FitVN</h2>
            {mode === "android" ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Thêm FitVN vào màn hình chính để mở nhanh hơn và dùng được khi
                offline.
              </p>
            ) : (
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Nhấn nút{" "}
                <span className="inline-flex items-center gap-0.5 font-medium text-text">
                  Chia sẻ <ShareIcon />
                </span>{" "}
                ở thanh Safari, rồi chọn{" "}
                <strong className="font-semibold text-text">
                  “Thêm vào MH chính”
                </strong>
                .
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Bỏ qua"
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-muted transition hover:bg-surface-raised"
          >
            <CloseIcon />
          </button>
        </div>

        {mode === "android" ? (
          <div className="flex gap-2 border-t border-border p-3">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-pill px-4 py-2.5 text-sm font-semibold text-muted transition active:scale-95"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="flex-[2] rounded-pill bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg transition active:scale-95"
            >
              Cài đặt
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline"
    >
      <path d="M12 16V4" />
      <polyline points="8 8 12 4 16 8" />
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
