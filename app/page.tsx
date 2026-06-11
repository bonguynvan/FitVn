import Link from "next/link";
import {
  Bot,
  Dumbbell,
  Flame,
  LineChart,
  LogOut,
  Salad,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/app/login/actions";
import { getDashboard, type DashboardData } from "@/lib/data/dashboard";
import { PushManager } from "@/components/pwa/PushManager";
import {
  Card,
  EmptyState,
  IconBadge,
  Pill,
  ProgressRing,
  SectionHeader,
  StatTile,
} from "@/components/ui";

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

function formatKcal(n: number): string {
  return n.toLocaleString("vi-VN");
}

export default async function HomePage() {
  const [user, data] = await Promise.all([getCurrentUser(), getDashboard()]);
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
          <p className="text-xs font-semibold tracking-wide opacity-90">
            {todayLabel()}
          </p>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Đăng xuất"
              className="-mr-1 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-btn bg-white/15 text-primary-fg transition active:scale-95"
            >
              <LogOut size={17} aria-hidden />
            </button>
          </form>
        </div>
        <h1 className="mt-1 text-3xl leading-tight">Chào {name}!</h1>
        <p className="mt-2 max-w-[32ch] text-sm leading-relaxed opacity-95">
          Sẵn sàng cho một ngày khỏe mạnh chứ?
        </p>
      </header>

      {/* Today summary — real data, or a welcome state until there is some */}
      {data.hasData && data.calories ? (
        <TodaySummary data={data} />
      ) : (
        <section aria-labelledby="start-heading" className="flex flex-col gap-3">
          <SectionHeader id="start-heading">Bắt đầu</SectionHeader>
          <EmptyState
            icon={Sparkles}
            title="Bắt đầu hành trình của bạn"
            description="Ghi buổi tập và bữa ăn đầu tiên để FitVN theo dõi calo, macro và tiến độ cho bạn."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/workouts"
                  className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
                >
                  <Dumbbell size={16} aria-hidden />
                  Ghi buổi tập
                </Link>
                <Link
                  href="/nutrition"
                  className="inline-flex items-center gap-2 rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary/50 active:scale-95"
                >
                  <Salad size={16} aria-hidden />
                  Ghi bữa ăn
                </Link>
              </div>
            }
          />
        </section>
      )}

      {/* Quick links — app navigation */}
      <section aria-labelledby="links-heading" className="flex flex-col gap-3">
        <SectionHeader id="links-heading">Lối tắt</SectionHeader>
        <ul className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-primary/50 active:scale-[0.99]"
                >
                  <IconBadge tone={link.tone} size="md">
                    <Icon size={20} aria-hidden />
                  </IconBadge>
                  <span className="mt-1 text-base font-semibold text-text">
                    {link.label}
                  </span>
                  <span className="text-sm leading-snug text-muted">
                    {link.hint}
                  </span>
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

/** Data-present dashboard: calories ring + macros + a stat row. */
function TodaySummary({ data }: { data: DashboardData }) {
  const cals = data.calories!;
  const remaining = Math.max(cals.goal - cals.consumed, 0);

  return (
    <section aria-labelledby="today-heading" className="flex flex-col gap-3">
      <SectionHeader id="today-heading">Hôm nay</SectionHeader>

      <Card raised padding="lg" className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={cals.consumed}
            max={cals.goal}
            size={116}
            stroke={12}
            label={`${formatKcal(cals.consumed)} trên ${formatKcal(cals.goal)} kcal`}
          >
            <Flame size={20} className="text-primary" aria-hidden />
            <span className="mt-0.5 text-xl font-semibold leading-none text-text">
              {formatKcal(cals.consumed)}
            </span>
            <span className="text-[11px] font-medium text-muted">
              / {formatKcal(cals.goal)} kcal
            </span>
          </ProgressRing>

          <div className="min-w-0 flex-1">
            <Pill tone="accent">Còn {formatKcal(remaining)} kcal</Pill>
            <p className="mt-2 text-sm leading-snug text-muted">
              Tiếp tục giữ phong độ — ghi bữa ăn để cập nhật macro.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {data.macros.map((macro) => {
            const ratio = macro.target > 0 ? Math.min(macro.value / macro.target, 1) : 0;
            return (
              <div key={macro.label} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-text">{macro.label}</span>
                  <span className="text-muted">
                    <span className="font-semibold text-text">{macro.value}</span>
                    {" / "}
                    {macro.target}
                    {macro.unit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-surface-raised">
                  <div
                    className="h-full rounded-pill bg-primary"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Chuỗi ngày" value={data.stats.streakDays} unit="ngày" icon={<Flame size={16} />} />
        <StatTile label="Buổi / tuần" value={data.stats.weekSessions} unit="buổi" icon={<Dumbbell size={16} />} />
        <StatTile
          label="Cân nặng"
          value={data.stats.weightKg ?? "—"}
          unit={data.stats.weightKg ? "kg" : undefined}
          icon={<Scale size={16} />}
        />
      </div>
    </section>
  );
}
