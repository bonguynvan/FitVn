import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaShell } from "@/components/pwa/PwaShell";

const APP_NAME = "FitVN";
const APP_DESCRIPTION =
  "Ứng dụng tập gym và dinh dưỡng dành cho người Việt — kế hoạch tập luyện, theo dõi món ăn và huấn luyện viên AI.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "FitVN — Tập luyện & Dinh dưỡng",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
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
    <html lang="vi">
      <body className="min-h-dvh bg-bg text-text">
        <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col px-safe">
          {children}
        </div>
        {/* App-wide PWA behavior: install prompt + offline sync lifecycle. */}
        <PwaShell />
      </body>
    </html>
  );
}
