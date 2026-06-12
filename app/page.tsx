import Link from "next/link";
import { Bot, Dumbbell, LineChart, Salad, User, type LucideIcon } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { CoachNudge } from "@/components/home/CoachNudge";
import { DailyCheckIn } from "@/components/home/DailyCheckIn";
import { ProfileNudge } from "@/components/home/ProfileNudge";
import { TodayDashboard } from "@/components/home/TodayDashboard";
import { PushManager } from "@/components/pwa/PushManager";
import { IconBadge, SectionHeader } from "@/components/ui";

interface QuickLink {
  readonly href: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: LucideIcon;
  readonly tone: "primary" | "accent" | "success" | "muted";
}

const QUICK_LINKS: ReadonlyArray<QuickLink> = [
  { href: "/workouts", label: "Lịch tập", hint: "Buổi tập & bài tập", icon: Dumbbell, tone: "primary" },
  { href: "/nutrition", label: "Dinh dưỡng", hint: "Ghi món & macro", icon: Salad, tone: "success" },
  { href: "/coach", label: "HLV AI", hint: "Hỏi đáp tức thì", icon: Bot, tone: "accent" },
  { href: "/progress", label: "Tiến độ", hint: "Cân nặng & số đo", icon: LineChart, tone: "muted" },
];

function todayLabel(): string {
  const now = new Date();
  const opts = { timeZone: "Asia/Ho_Chi_Minh" } as const;
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long", ...opts }).format(now);
  const dm = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", ...opts }).format(now);
  return `${weekday}, ${dm}`;
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const name = user?.name ?? "bạn";

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      {/* Greeting */}
      <header className="relative overflow-hidden rounded-card bg-primary px-5 pb-7 pt-8 text-primary-fg shadow-glow">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl"
        />
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide opacity-90">{todayLabel()}</p>
          <Link
            href="/profile"
            aria-label="Hồ sơ"
            className="-mr-1 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-btn bg-white/15 text-primary-fg transition active:scale-95"
          >
            <User size={17} aria-hidden />
          </Link>
        </div>
        <h1 className="mt-1 text-3xl leading-tight">Chào {name}!</h1>
        <p className="mt-2 max-w-[32ch] text-sm leading-relaxed opacity-95">
          Sẵn sàng cho một ngày khỏe mạnh chứ?
        </p>
      </header>

      {/* Personalize-goal nudge (hidden once a profile exists) */}
      <ProfileNudge />

      {/* Personalized coach insight (shown once a profile exists) */}
      <CoachNudge />

      {/* Today — reactive to locally-logged data */}
      <TodayDashboard />

      {/* Daily wellbeing check-in */}
      <DailyCheckIn />

      {/* Quick links */}
      <section aria-labelledby="links-heading" className="flex flex-col gap-3">
        <SectionHeader id="links-heading">Lối tắt</SectionHeader>
        <ul className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group lift flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card hover:border-primary/50"
                >
                  <IconBadge tone={link.tone} size="md">
                    <Icon size={20} aria-hidden />
                  </IconBadge>
                  <span className="mt-1 text-base font-semibold text-text">{link.label}</span>
                  <span className="text-sm leading-snug text-muted">{link.hint}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Notifications opt-in */}
      <section aria-labelledby="notify-heading" className="flex flex-col gap-3">
        <SectionHeader id="notify-heading">Thông báo</SectionHeader>
        <PushManager />
      </section>

      <footer className="mt-auto px-1 pt-2 text-center text-xs text-muted">
        FitVN · Ứng dụng PWA cho người Việt
      </footer>
    </main>
  );
}
