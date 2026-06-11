import type { Metadata, Viewport } from "next";
import { Lora, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/nav/BottomNav";
import { PwaShell } from "@/components/pwa/PwaShell";

/**
 * Warm earthy type system (Vietnamese-ready):
 *  - Lora: soft, organic serif for page titles (--font-display, used by h1).
 *  - Nunito Sans: warm humanist sans for body/UI (--font-sans).
 * Both self-hosted by next/font (no layout shift, offline-safe).
 */
const lora = Lora({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-lora",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
  // Nunito Sans has no metric-override entry in next/font; skip the auto
  // adjusted fallback (silences the build warning) and rely on system-ui.
  adjustFontFallback: false,
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
  // Warm cream status-bar tint; no dark variant (the app is light-only).
  themeColor: "#faf8f4",
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
    <html lang="vi" className={`${lora.variable} ${nunitoSans.variable}`}>
      <body className="min-h-dvh bg-bg text-text">
        {/*
         * Scrollable single-column app shell. Bottom padding clears the fixed
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
      </body>
    </html>
  );
}
