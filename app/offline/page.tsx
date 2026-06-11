import type { Metadata } from "next";
import Link from "next/link";

/**
 * Offline fallback page.
 *
 * Wired via next.config.mjs `fallbacks.document = "/offline"`: the service
 * worker serves this route for any navigation request that misses both the
 * network and the cache. Must be fully static (no client data fetch) so it
 * renders with zero connectivity.
 */
export const metadata: Metadata = {
  title: "Đang offline",
  description: "Bạn đang offline. Một số dữ liệu đã lưu vẫn dùng được.",
};

const STILL_WORKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Xem các buổi tập đã lưu trong máy", href: "/workout" },
  { label: "Xem nhật ký món ăn đã cache", href: "/nutrition" },
  { label: "Tìm món ăn trong thư viện offline", href: "/nutrition/log" },
];

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12 pb-safe text-center">
      {/* Disconnected mark */}
      <div
        aria-hidden
        className="relative flex h-24 w-24 items-center justify-center rounded-card bg-surface-raised shadow-card"
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 2 L22 22" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M5 12.5a10 10 0 0 1 4-2.4" />
          <path d="M15 10.1a10 10 0 0 1 4 2.4" />
          <path d="M2 8.8a16 16 0 0 1 4.5-2.7" />
          <path d="M17.5 6.1A16 16 0 0 1 22 8.8" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Bạn đang offline
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">
          Không có kết nối mạng. FitVN vẫn giữ lại dữ liệu đã lưu để bạn không
          mất nhịp tập.
        </p>
      </div>

      {/* What still works offline */}
      <section className="w-full max-w-xs rounded-card bg-surface p-5 text-left shadow-card">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted">
          Vẫn dùng được khi offline
        </h2>
        <ul className="space-y-3">
          {STILL_WORKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 text-sm font-medium text-text transition-colors hover:text-primary"
              >
                <span
                  aria-hidden
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-accent/20 text-accent-fg"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-muted">
        Thay đổi của bạn sẽ tự đồng bộ khi có mạng trở lại.
      </p>

      {/*
        Reload uses a plain <a> (not next/link) so it triggers a real
        navigation the service worker can intercept once connectivity returns.
      */}
      <a
        href="/"
        className="rounded-btn bg-primary px-6 py-3 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
      >
        Thử kết nối lại
      </a>
    </main>
  );
}
