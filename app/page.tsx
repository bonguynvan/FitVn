import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Dumbbell,
  Flame,
  LineChart,
  Play,
  Salad,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { PushManager } from "@/components/pwa/PushManager";
import {
  Card,
  IconBadge,
  MiniBarChart,
  Pill,
  ProgressRing,
  SectionHeader,
  StatTile,
} from "@/components/ui";

/**
 * Home — the reference FitVN screen.
 *
 * Server Component built entirely from mock Vietnamese data + the shared UI
 * primitives. Demonstrates the design language for the page agents: signature
 * coral→orange gradient hero, a calories ProgressRing + macro mini-bars, a
 * workout-of-the-day card, a StatTile bento row, and quick links. No network,
 * no client state, lucide icons only.
 */

// --- Mock data (static, realistic) -----------------------------------------

const USER_NAME = "Minh";
const TODAY_LABEL = "Thứ Sáu, 12/06";
const MOTIVATION = "Hôm nay là ngày đẩy ngực — giữ vững phong độ nhé!";

const CALORIES = { value: 1450, goal: 2200 } as const;

interface Macro {
  readonly label: string;
  readonly value: number;
  readonly target: number;
  readonly unit: string;
}

const MACROS: ReadonlyArray<Macro> = [
  { label: "Đạm", value: 98, target: 150, unit: "g" },
  { label: "Tinh bột", value: 165, target: 240, unit: "g" },
  { label: "Chất béo", value: 42, target: 70, unit: "g" },
];

const WORKOUT = {
  title: "Push Day",
  focus: "Ngực · Vai · Tay sau",
  exercises: 5,
  minutes: 50,
} as const;

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

const WEEKLY_SESSIONS = [
  { label: "T2", value: 1 },
  { label: "T3", value: 0 },
  { label: "T4", value: 1 },
  { label: "T5", value: 1 },
  { label: "T6", value: 1 },
  { label: "T7", value: 0 },
  { label: "CN", value: 0 },
] as const;

// --- Helpers ---------------------------------------------------------------

function formatKcal(n: number): string {
  return n.toLocaleString("vi-VN");
}

// --- Page ------------------------------------------------------------------

export default function HomePage() {
  const remaining = CALORIES.goal - CALORIES.value;

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      {/* Greeting band — signature coral→orange gradient + lime accent blur */}
      <header className="relative overflow-hidden rounded-card bg-primary px-5 pb-7 pt-8 text-primary-fg shadow-glow">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-accent/45 blur-2xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-accent/25 blur-3xl"
        />
        <p className="text-xs font-semibold tracking-wide opacity-90">
          {TODAY_LABEL}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight">
          Chào {USER_NAME}!
        </h1>
        <p className="mt-2 max-w-[32ch] text-sm leading-relaxed opacity-95">
          {MOTIVATION}
        </p>
      </header>

      {/* Today summary — calories ring + macro mini-bars */}
      <section aria-labelledby="today-heading" className="flex flex-col gap-3">
        <SectionHeader id="today-heading">Hôm nay</SectionHeader>
        <Card raised padding="lg" className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <ProgressRing
              value={CALORIES.value}
              max={CALORIES.goal}
              size={116}
              stroke={12}
              label={`${formatKcal(CALORIES.value)} trên ${formatKcal(
                CALORIES.goal,
              )} kcal`}
            >
              <Flame size={20} className="text-primary" aria-hidden />
              <span className="mt-0.5 text-xl font-extrabold leading-none text-text">
                {formatKcal(CALORIES.value)}
              </span>
              <span className="text-[11px] font-medium text-muted">
                / {formatKcal(CALORIES.goal)} kcal
              </span>
            </ProgressRing>

            <div className="min-w-0 flex-1">
              <Pill tone="accent">Còn {formatKcal(remaining)} kcal</Pill>
              <p className="mt-2 text-sm leading-snug text-muted">
                Bạn đang đi đúng hướng. Bữa tối nhẹ là vừa đủ ngân sách calo hôm
                nay.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {MACROS.map((macro) => {
              const ratio = Math.min(macro.value / macro.target, 1);
              return (
                <div key={macro.label} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-text">
                      {macro.label}
                    </span>
                    <span className="text-muted">
                      <span className="font-bold text-text">
                        {macro.value}
                      </span>
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
      </section>

      {/* Workout of the day */}
      <section aria-labelledby="wod-heading" className="flex flex-col gap-3">
        <SectionHeader id="wod-heading">Buổi tập hôm nay</SectionHeader>
        <Card padding="lg" className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <IconBadge tone="primary" size="lg">
              <Dumbbell size={26} aria-hidden />
            </IconBadge>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-text">
                  {WORKOUT.title}
                </h3>
                <Pill tone="primary">{WORKOUT.exercises} bài</Pill>
              </div>
              <p className="mt-0.5 text-sm text-muted">{WORKOUT.focus}</p>
              <p className="mt-1 text-xs font-medium tracking-wide text-muted">
                Khoảng {WORKOUT.minutes} phút
              </p>
            </div>
          </div>
          <Link
            href="/workouts"
            className="inline-flex items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3 text-sm font-bold text-primary-fg shadow-glow transition-transform active:scale-95"
          >
            <Play size={18} fill="currentColor" aria-hidden />
            Bắt đầu
          </Link>
        </Card>
      </section>

      {/* Stat bento row */}
      <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
        <SectionHeader id="stats-heading">Tổng quan</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Chuỗi ngày"
            value="12"
            unit="ngày"
            icon={<Flame size={18} aria-hidden />}
            delta="Kỷ lục mới"
            deltaTone="success"
            className="col-span-1"
          />
          <StatTile
            label="Buổi tập tuần"
            value="4"
            unit="buổi"
            icon={<Dumbbell size={18} aria-hidden />}
            delta="+1 so với tuần trước"
            deltaTone="success"
            className="col-span-1"
          />
          <StatTile
            label="Cân nặng"
            value="70,5"
            unit="kg"
            icon={<Scale size={18} aria-hidden />}
            delta="-0,8kg tháng này"
            deltaTone="success"
            className="col-span-2"
          />
        </div>
      </section>

      {/* Weekly activity snapshot */}
      <section aria-labelledby="week-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="week-heading"
          action={
            <Link
              href="/progress"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary active:scale-95"
            >
              Chi tiết
              <TrendingUp size={14} aria-hidden />
            </Link>
          }
        >
          Hoạt động tuần này
        </SectionHeader>
        <Card padding="lg">
          <MiniBarChart
            data={WEEKLY_SESSIONS}
            goal={1}
            ariaLabel="Số buổi tập theo từng ngày trong tuần"
          />
        </Card>
      </section>

      {/* Quick links — bento, not uniform */}
      <section aria-labelledby="links-heading" className="flex flex-col gap-3">
        <SectionHeader id="links-heading">Lối tắt</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-primary/60 active:scale-[0.99]"
              >
                <IconBadge tone={link.tone} size="md">
                  <Icon size={22} aria-hidden />
                </IconBadge>
                <div>
                  <span className="block text-base font-bold text-text">
                    {link.label}
                  </span>
                  <span className="block text-xs text-muted">{link.hint}</span>
                </div>
                <ArrowRight
                  size={18}
                  aria-hidden
                  className="mt-auto text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Notification opt-in — wires the Web Push flow into the live UI */}
      <section aria-labelledby="notify-heading" className="flex flex-col gap-3">
        <SectionHeader id="notify-heading">Thông báo</SectionHeader>
        <PushManager />
      </section>

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        FitVN · Ứng dụng PWA cho người Việt
      </footer>
    </main>
  );
}
