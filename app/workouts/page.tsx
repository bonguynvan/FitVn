import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  MoveVertical,
  Play,
  Repeat,
  Target,
  type LucideIcon,
} from "lucide-react";

import { DayChip, type PlannedDay } from "@/components/workouts/DayChip";
import {
  ExerciseRow,
  type Exercise,
} from "@/components/workouts/ExerciseRow";
import {
  Card,
  IconBadge,
  MiniBarChart,
  Pill,
  SectionHeader,
  StatTile,
} from "@/components/ui";
import { PageHeader } from "@/components/nav/PageHeader";

/**
 * Workouts — the training plan screen.
 *
 * Static Server Component built from mock Vietnamese data and the shared UI
 * primitives, matching the home reference's visual language: signature
 * coral→orange treatment on the today-session card, tonal IconBadges, StatTile
 * bento, and a pure-SVG MiniBarChart. No network, no client state, lucide icons
 * only, zero emoji.
 */

export const metadata: Metadata = {
  title: "Lịch tập",
};

// --- Mock data (static, realistic) -----------------------------------------

const WEEK_LABEL = "Tuần này · 4/5 buổi";

const WEEK_PLAN: ReadonlyArray<PlannedDay> = [
  { label: "T2", state: "done" },
  { label: "T3", state: "rest" },
  { label: "T4", state: "done" },
  { label: "T5", state: "done" },
  { label: "T6", state: "today" },
  { label: "T7", state: "planned" },
  { label: "CN", state: "rest" },
];

const TODAY_SESSION = {
  title: "Push Day",
  focus: "Ngực · Vai · Tay sau",
  minutes: 50,
  exercises: 5,
  volume: "16 hiệp",
} as const;

const EXERCISES: ReadonlyArray<Exercise> = [
  {
    name: "Bench Press",
    target: "4 hiệp × 8-10",
    muscle: "Ngực",
    muscleTone: "primary",
    icon: Dumbbell,
  },
  {
    name: "Overhead Press",
    target: "4 hiệp × 8-10",
    muscle: "Vai",
    muscleTone: "accent",
    icon: ChevronUp,
  },
  {
    name: "Incline Dumbbell Press",
    target: "3 hiệp × 10-12",
    muscle: "Ngực trên",
    muscleTone: "primary",
    icon: Dumbbell,
  },
  {
    name: "Triceps Pushdown",
    target: "3 hiệp × 12-15",
    muscle: "Tay sau",
    muscleTone: "success",
    icon: Repeat,
  },
  {
    name: "Lateral Raise",
    target: "3 hiệp × 15",
    muscle: "Vai giữa",
    muscleTone: "accent",
    icon: MoveVertical,
  },
];

interface RecentSession {
  readonly id: string;
  readonly name: string;
  readonly focus: string;
  readonly date: string;
  readonly minutes: number;
  readonly volumeKg: number;
  readonly icon: LucideIcon;
  readonly tone: "primary" | "accent" | "success" | "muted";
}

const RECENT_SESSIONS: ReadonlyArray<RecentSession> = [
  {
    id: "pull-thu",
    name: "Pull Day",
    focus: "Lưng · Tay trước",
    date: "Hôm qua, 11/06",
    minutes: 55,
    volumeKg: 8420,
    icon: Dumbbell,
    tone: "accent",
  },
  {
    id: "legs-wed",
    name: "Leg Day",
    focus: "Đùi · Mông · Bắp chân",
    date: "Thứ Tư, 10/06",
    minutes: 62,
    volumeKg: 11250,
    icon: Dumbbell,
    tone: "primary",
  },
  {
    id: "push-mon",
    name: "Push Day",
    focus: "Ngực · Vai · Tay sau",
    date: "Thứ Hai, 08/06",
    minutes: 48,
    volumeKg: 7680,
    icon: Dumbbell,
    tone: "success",
  },
  {
    id: "cardio-sun",
    name: "Cardio & Core",
    focus: "Tim mạch · Bụng",
    date: "Chủ Nhật, 07/06",
    minutes: 35,
    volumeKg: 0,
    icon: Flame,
    tone: "muted",
  },
];

// Weekly training volume (minutes per day); accent bars mark days >= goal.
const WEEKLY_VOLUME = [
  { label: "T2", value: 48 },
  { label: "T3", value: 0 },
  { label: "T4", value: 62 },
  { label: "T5", value: 55 },
  { label: "T6", value: 50 },
  { label: "T7", value: 0 },
  { label: "CN", value: 0 },
] as const;

const VOLUME_GOAL_MIN = 45;

// --- Helpers ---------------------------------------------------------------

function formatKg(n: number): string {
  return n.toLocaleString("vi-VN");
}

// --- Page ------------------------------------------------------------------

export default function WorkoutsPage() {
  const totalMinutes = WEEKLY_VOLUME.reduce((sum, d) => sum + d.value, 0);

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <PageHeader
        eyebrow="Lịch tập"
        title="Kế hoạch tuần"
        subtitle={WEEK_LABEL}
        className="px-1 pt-2"
        action={
          <Pill tone="success" icon={<Flame size={13} aria-hidden />}>
            80%
          </Pill>
        }
      />

      {/* Weekly plan strip — 7 day chips, today highlighted */}
      <section aria-labelledby="plan-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="plan-heading"
          action={
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
              <CalendarDays size={14} aria-hidden />6 - 12/06
            </span>
          }
        >
          Kế hoạch tuần
        </SectionHeader>
        <Card padding="sm">
          <div className="flex items-stretch gap-1.5">
            {WEEK_PLAN.map((day) => (
              <DayChip key={day.label} day={day} />
            ))}
          </div>
        </Card>
      </section>

      {/* Today's session — signature gradient hero treatment */}
      <section aria-labelledby="today-heading" className="flex flex-col gap-3">
        <SectionHeader id="today-heading">Buổi tập hôm nay</SectionHeader>
        <Card padding="none" className="overflow-hidden">
          {/* Gradient band header */}
          <div className="relative overflow-hidden bg-primary px-5 pb-5 pt-5 text-primary-fg">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/45 blur-2xl"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -left-4 h-24 w-24 rounded-full bg-accent/25 blur-3xl"
            />
            <div className="relative flex items-start gap-3">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-fg/15 backdrop-blur-sm">
                <Dumbbell size={26} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wide opacity-90">
                  Hôm nay
                </p>
                <h3 className="mt-0.5 text-xl font-extrabold leading-tight">
                  {TODAY_SESSION.title}
                </h3>
                <p className="mt-0.5 text-sm opacity-95">
                  {TODAY_SESSION.focus}
                </p>
              </div>
            </div>

            {/* Inline session meta */}
            <dl className="relative mt-4 flex items-center gap-4 text-sm font-semibold">
              <div className="flex items-center gap-1.5">
                <Clock size={16} aria-hidden className="opacity-90" />
                <dt className="sr-only">Thời lượng</dt>
                <dd>{TODAY_SESSION.minutes} phút</dd>
              </div>
              <span aria-hidden className="h-3.5 w-px bg-primary-fg/30" />
              <div className="flex items-center gap-1.5">
                <Target size={16} aria-hidden className="opacity-90" />
                <dt className="sr-only">Số bài tập</dt>
                <dd>{TODAY_SESSION.exercises} bài</dd>
              </div>
              <span aria-hidden className="h-3.5 w-px bg-primary-fg/30" />
              <div className="flex items-center gap-1.5">
                <Repeat size={16} aria-hidden className="opacity-90" />
                <dt className="sr-only">Tổng hiệp</dt>
                <dd>{TODAY_SESSION.volume}</dd>
              </div>
            </dl>
          </div>

          {/* Exercise list */}
          <div className="px-3 py-3">
            <ol className="flex flex-col gap-0.5">
              {EXERCISES.map((exercise, i) => (
                <ExerciseRow
                  key={exercise.name}
                  exercise={exercise}
                  index={i + 1}
                />
              ))}
            </ol>
          </div>

          {/* Primary CTA */}
          <div className="px-4 pb-4">
            <Link
              href="/workouts"
              className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3.5 text-sm font-bold text-primary-fg shadow-glow transition-transform active:scale-[0.98]"
            >
              <Play size={18} fill="currentColor" aria-hidden />
              Bắt đầu buổi tập
            </Link>
          </div>
        </Card>
      </section>

      {/* Weekly volume chart */}
      <section aria-labelledby="volume-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="volume-heading"
          action={
            <span className="text-xs font-bold tabular-nums text-text">
              {totalMinutes} phút
            </span>
          }
        >
          Khối lượng tuần
        </SectionHeader>
        <Card raised padding="lg" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium leading-snug text-muted">
              Số phút tập mỗi ngày. Vạch đứt là mục tiêu {VOLUME_GOAL_MIN} phút.
            </p>
            <Pill tone="accent">3/5 đạt</Pill>
          </div>
          <MiniBarChart
            data={WEEKLY_VOLUME}
            goal={VOLUME_GOAL_MIN}
            height={104}
            ariaLabel="Số phút tập theo từng ngày trong tuần, so với mục tiêu 45 phút"
          />
        </Card>
      </section>

      {/* Quick stats bento */}
      <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
        <SectionHeader id="stats-heading">Tổng quan tuần</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Buổi đã tập"
            value="4"
            unit="/ 5"
            icon={<Dumbbell size={18} aria-hidden />}
            delta="+1 so với tuần trước"
            deltaTone="success"
          />
          <StatTile
            label="Tổng thời lượng"
            value="3,6"
            unit="giờ"
            icon={<Clock size={18} aria-hidden />}
            delta="Vượt mục tiêu"
            deltaTone="success"
          />
        </div>
      </section>

      {/* Recent sessions */}
      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="recent-heading"
          action={
            <Link
              href="/progress"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary active:scale-95"
            >
              Tất cả
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          }
        >
          Buổi tập gần đây
        </SectionHeader>
        <ul className="flex flex-col gap-3">
          {RECENT_SESSIONS.map((session) => {
            const Icon = session.icon;
            return (
              <li key={session.id}>
                <Card
                  padding="md"
                  className="flex items-center gap-3 transition-colors hover:border-primary/50 active:scale-[0.99]"
                >
                  <IconBadge tone={session.tone} size="md">
                    <Icon size={22} aria-hidden />
                  </IconBadge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-sm font-bold text-text">
                        {session.name}
                      </p>
                      <span className="shrink-0 text-[11px] font-medium text-muted">
                        {session.date}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {session.focus}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} aria-hidden />
                        {session.minutes} phút
                      </span>
                      {session.volumeKg > 0 ? (
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Dumbbell size={12} aria-hidden />
                          {formatKg(session.volumeKg)} kg
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Flame size={12} aria-hidden />
                          Đốt mỡ
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        Giữ vững phong độ — buổi kế tiếp luôn quan trọng nhất.
      </footer>
    </main>
  );
}
