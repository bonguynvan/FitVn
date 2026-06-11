import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Dumbbell,
  Flame,
  Play,
  Plus,
  Repeat,
  Target,
} from "lucide-react";

import { DayChip } from "@/components/workouts/DayChip";
import { ExerciseRow } from "@/components/workouts/ExerciseRow";
import {
  Card,
  EmptyState,
  IconBadge,
  MiniBarChart,
  Pill,
  SectionHeader,
  StatTile,
} from "@/components/ui";
import { PageHeader } from "@/components/nav/PageHeader";
import { getWorkouts, type WorkoutsData } from "@/lib/data/workouts";

/**
 * Workouts — the training plan screen.
 *
 * Async Server Component: reads its snapshot from the workouts data layer
 * (`getWorkouts`). Until a plan is synced from Supabase that returns an empty
 * snapshot, so the screen shows a polished "no plan yet" empty state; once
 * there is data it renders the full plan — the day strip, the signature
 * coral→orange today-session card, the exercise list, a pure-SVG weekly volume
 * chart, the week-summary bento, and recent sessions. No client state, lucide
 * icons only, zero emoji.
 */

export const metadata: Metadata = {
  title: "Lịch tập",
};

function formatKg(n: number): string {
  return n.toLocaleString("vi-VN");
}

export default async function WorkoutsPage() {
  const data = await getWorkouts();

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <PageHeader
        eyebrow="Lịch tập"
        title="Kế hoạch tuần"
        subtitle={data.hasData ? data.weekLabel : "Lập kế hoạch tập luyện của bạn"}
        className="px-1 pt-2"
        action={
          data.hasData ? (
            <Pill tone="success" icon={<Flame size={13} aria-hidden />}>
              {data.completionPct}%
            </Pill>
          ) : undefined
        }
      />

      {data.hasData ? (
        <WorkoutsContent data={data} />
      ) : (
        <section aria-labelledby="empty-heading" className="flex flex-col gap-3">
          <SectionHeader id="empty-heading">Bắt đầu</SectionHeader>
          <EmptyState
            icon={Dumbbell}
            title="Chưa có lịch tập"
            description="Tạo lịch tập đầu tiên để FitVN sắp xếp buổi tập theo tuần, gợi ý bài tập và theo dõi khối lượng cho bạn."
            action={
              <Link
                href="/workouts"
                className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
              >
                <Plus size={16} aria-hidden />
                Tạo lịch tập
              </Link>
            }
          />
        </section>
      )}

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        Giữ vững phong độ — buổi kế tiếp luôn quan trọng nhất.
      </footer>
    </main>
  );
}

/** Data-present plan: day strip, today session, volume chart, recent sessions. */
function WorkoutsContent({ data }: { data: WorkoutsData }) {
  const totalMinutes = data.weeklyVolume.reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      {/* Weekly plan strip — 7 day chips, today highlighted */}
      <section aria-labelledby="plan-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="plan-heading"
          action={
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
              <CalendarDays size={14} aria-hidden />
              {data.weekRange}
            </span>
          }
        >
          Kế hoạch tuần
        </SectionHeader>
        <Card padding="sm">
          <div className="flex items-stretch gap-1.5">
            {data.weekPlan.map((day) => (
              <DayChip key={day.label} day={day} />
            ))}
          </div>
        </Card>
      </section>

      {/* Today's session — signature gradient hero treatment */}
      {data.todaySession ? (
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
                    {data.todaySession.title}
                  </h3>
                  <p className="mt-0.5 text-sm opacity-95">
                    {data.todaySession.focus}
                  </p>
                </div>
              </div>

              {/* Inline session meta */}
              <dl className="relative mt-4 flex items-center gap-4 text-sm font-semibold">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} aria-hidden className="opacity-90" />
                  <dt className="sr-only">Thời lượng</dt>
                  <dd>{data.todaySession.minutes} phút</dd>
                </div>
                <span aria-hidden className="h-3.5 w-px bg-primary-fg/30" />
                <div className="flex items-center gap-1.5">
                  <Target size={16} aria-hidden className="opacity-90" />
                  <dt className="sr-only">Số bài tập</dt>
                  <dd>{data.todaySession.exercises} bài</dd>
                </div>
                <span aria-hidden className="h-3.5 w-px bg-primary-fg/30" />
                <div className="flex items-center gap-1.5">
                  <Repeat size={16} aria-hidden className="opacity-90" />
                  <dt className="sr-only">Tổng hiệp</dt>
                  <dd>{data.todaySession.volume}</dd>
                </div>
              </dl>
            </div>

            {/* Exercise list */}
            <div className="px-3 py-3">
              <ol className="flex flex-col gap-0.5">
                {data.todayExercises.map((exercise, i) => (
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
      ) : null}

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
              Số phút tập mỗi ngày. Vạch đứt là mục tiêu {data.volumeGoalMin} phút.
            </p>
            <Pill tone="accent">{data.volumeGoalLabel}</Pill>
          </div>
          <MiniBarChart
            data={data.weeklyVolume}
            goal={data.volumeGoalMin}
            height={104}
            ariaLabel={`Số phút tập theo từng ngày trong tuần, so với mục tiêu ${data.volumeGoalMin} phút`}
          />
        </Card>
      </section>

      {/* Quick stats bento */}
      <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
        <SectionHeader id="stats-heading">Tổng quan tuần</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          {data.weekStats.map((stat) => (
            <StatTile
              key={stat.label}
              label={stat.label}
              value={stat.value}
              unit={stat.unit}
              icon={
                stat.label === "Tổng thời lượng" ? (
                  <Clock size={18} aria-hidden />
                ) : (
                  <Dumbbell size={18} aria-hidden />
                )
              }
              delta={stat.delta}
              deltaTone={stat.deltaTone}
            />
          ))}
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
          {data.recentSessions.map((session) => {
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
    </>
  );
}
