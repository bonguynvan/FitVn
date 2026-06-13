import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/nav/BottomNav";
import { PwaShell } from "@/components/pwa/PwaShell";
import { SyncManager } from "@/components/sync/SyncManager";
import { AchievementCelebration } from "@/components/achievements/AchievementCelebration";

/**
 * Be Vietnam Pro — a warm humanist sans designed for Vietnamese, used app-wide
 * (headings + body). Self-hosted by next/font (no layout shift, offline-safe).
 */
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-app-sans",
  display: "swap",
});

const APP_NAME = "FitVN";
const APP_DESCRIPTION =
  "Ứng dụng tập gym và dinh dưỡng dành cho người Việt — kế hoạch tập luyện, theo dõi món ăn và huấn luyện viên AI.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "FitVN — Tập luyện & dinh dưỡng",
    template: "%s · FitVN",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // Fresh off-white status-bar tint; light-only.
  themeColor: "#f6f8f5",
  width: "device-width",
  initialScale: 1,
  // Allow a little zoom for accessibility but cap it to avoid the iOS
  // input-focus zoom jump that breaks the standalone PWA layout.
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="min-h-dvh bg-bg text-text">
        {/*
         * Mobile-first single-column app shell. Bottom padding clears the fixed
         * BottomNav (~56px tab row) plus the device safe-area inset so content
         * never hides behind the tab bar.
         */}
        <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col px-safe pb-[calc(72px+env(safe-area-inset-bottom))]">
          {children}
        </div>
        {/* Primary navigation, rendered once for every route. */}
        <BottomNav />
        {/* App-wide PWA behavior: install prompt + offline sync lifecycle. */}
        <PwaShell />
        {/* App-wide cloud auto-sync: pull on a fresh device, debounce-push edits. */}
        <SyncManager />
        {/* Celebrate newly-earned achievements with a toast + confetti. */}
        <AchievementCelebration />
      </body>
    </html>
  );
}
