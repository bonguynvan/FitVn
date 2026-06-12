"use client";

/**
 * BottomNav — fixed, translucent bottom tab bar for the FitVN PWA.
 *
 * Five primary destinations with lucide icons + Vietnamese labels. The active
 * tab (exact match for "/", prefix match elsewhere) is rendered in the primary
 * color with a filled icon badge + a small top indicator bar; inactive tabs are
 * muted. backdrop-blur + top border give it depth over scrolling content. Safe-
 * area aware and centered to max-w-app. Tap targets are >= 44px.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Dumbbell,
  Home,
  Salad,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface Tab {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const TABS: ReadonlyArray<Tab> = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/workouts", label: "Lịch tập", icon: Dumbbell },
  { href: "/nutrition", label: "Dinh dưỡng", icon: Salad },
  { href: "/coach", label: "HLV AI", icon: Bot },
  { href: "/progress", label: "Tiến độ", icon: TrendingUp },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname() ?? "/";

  // No app chrome on the auth screen.
  if (pathname === "/login") return null;

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 pb-safe shadow-[0_-10px_30px_-16px_rgba(16,36,28,0.18)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-app items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="group relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 transition-transform active:scale-95"
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-0.5 w-8 rounded-pill bg-primary"
                  />
                )}
                <span
                  aria-hidden
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                    active ? "bg-primary/12 text-primary" : "text-muted"
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={`text-[10px] font-semibold leading-none ${
                    active ? "text-primary" : "text-muted"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
