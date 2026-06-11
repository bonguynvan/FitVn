import type { Metadata } from "next";
import {
  ArrowDownRight,
  Flame,
  HeartPulse,
  Medal,
  Ruler,
  Scale,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  IconBadge,
  MiniBarChart,
  Pill,
  SectionHeader,
  Sparkline,
  StatTile,
} from "@/components/ui";
import {
  AchievementRow,
  type Achievement,
} from "@/components/progress/AchievementRow";
import { PageHeader } from "@/components/nav/PageHeader";

/**
 * Progress — weight trend, body measurements, streak/consistency, and
 * achievement badges.
 *
 * Server Component built entirely from mock Vietnamese data + the shared UI
 * primitives. Mirrors the home screen's visual language: signature coral→orange
 * gradient accents, big bold stat numbers vs small uppercase muted labels, bento
 * composition, and lucide icons only. No network, no client state.
 */

export const metadata: Metadata = {
  title: "Tiến độ",
  description:
    "Theo dõi cân nặng, số đo cơ thể, chuỗi ngày tập luyện và thành tích của bạn.",
};

// --- Mock data (static, realistic) -----------------------------------------

/** ~8 weeks of body weight in kg, oldest → newest. */
const WEIGHT_SERIES = [72.0, 71.7, 71.5, 71.2, 71.3, 70.9, 70.7, 70.5] as const;

const WEIGHT_CURRENT = WEIGHT_SERIES[WEIGHT_SERIES.length - 1];
const WEIGHT_START = WEIGHT_SERIES[0];
const WEIGHT_DELTA = WEIGHT_CURRENT - WEIGHT_START; // -1.5

interface RangeOption {
  readonly id: string;
  readonly label: string;
}

const RANGE_OPTIONS: ReadonlyArray<RangeOption> = [
  { id: "4w", label: "4T" },
  { id: "8w", label: "8T" },
  { id: "1y", label: "1N" },
];

/** Currently highlighted range (static — interactivity comes later). */
const ACTIVE_RANGE = "8w";

interface Measurement {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly icon: LucideIcon;
  readonly delta: string;
  readonly deltaTone: "success" | "danger" | "muted";
  /** Span two columns in the bento grid. */
  readonly wide?: boolean;
}

const MEASUREMENTS: ReadonlyArray<Measurement> = [
  {
    label: "Cân nặng",
    value: "70,5",
    unit: "kg",
    icon: Scale,
    delta: "-1,5kg so với 8 tuần",
    deltaTone: "success",
    wide: true,
  },
  {
    label: "Tỷ lệ mỡ",
    value: "18,2",
    unit: "%",
    icon: HeartPulse,
    delta: "-2,1%",
    deltaTone: "success",
  },
  {
    label: "Vòng eo",
    value: "82",
    unit: "cm",
    icon: Ruler,
    delta: "-3cm",
    deltaTone: "success",
  },
  {
    label: "Vòng ngực",
    value: "98",
    unit: "cm",
    icon: Ruler,
    delta: "+1cm",
    deltaTone: "muted",
  },
];

const STREAK_DAYS = 12;
const STREAK_BEST = 18;

/** Workouts completed per week over the last 6 weeks. */
const WEEKLY_WORKOUTS = [
  { label: "T1", value: 3 },
  { label: "T2", value: 4 },
  { label: "T3", value: 2 },
  { label: "T4", value: 4 },
  { label: "T5", value: 5 },
  { label: "T6", value: 4 },
] as const;

const WORKOUT_GOAL = 4;

const ACHIEVEMENTS: ReadonlyArray<Achievement> = [
  {
    icon: Flame,
    title: "Chuỗi 7 ngày",
    description: "Tập đều 7 ngày liên tiếp không nghỉ.",
    tone: "primary",
    earned: true,
    meta: "06/06",
  },
  {
    icon: Target,
    title: "Đạt mục tiêu đạm",
    description: "Đủ lượng đạm mục tiêu 5 ngày liên tiếp.",
    tone: "accent",
    earned: true,
    meta: "10/06",
  },
  {
    icon: Medal,
    title: "Giảm 1kg đầu tiên",
    description: "Giảm được 1kg so với cân nặng ban đầu.",
    tone: "success",
    earned: true,
    meta: "28/05",
  },
  {
    icon: Trophy,
    title: "Chuỗi 30 ngày",
    description: "Duy trì chuỗi tập luyện 30 ngày liên tiếp.",
    tone: "warning",
    earned: false,
    meta: "12/30 ngày",
  },
];

// --- Helpers ---------------------------------------------------------------

function formatKg(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

const EARNED_COUNT = ACHIEVEMENTS.filter((a) => a.earned).length;

// --- Page ------------------------------------------------------------------

export default function ProgressPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <div className="pt-6">
        <PageHeader
          eyebrow="Tiến độ"
          title="Hành trình của bạn"
          subtitle="Cân nặng, số đo và thành tích — tất cả trong một nơi."
        />
      </div>

      {/* Weight trend — signature gradient header + area sparkline */}
      <section aria-labelledby="weight-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="weight-heading"
          action={
            <div className="flex items-center gap-1.5">
              {RANGE_OPTIONS.map((range) => (
                <Pill
                  key={range.id}
                  tone={range.id === ACTIVE_RANGE ? "primary" : "muted"}
                >
                  {range.label}
                </Pill>
              ))}
            </div>
          }
        >
          Cân nặng
        </SectionHeader>

        <Card raised padding="lg" className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-muted">
                Hiện tại
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold leading-none text-text">
                  {formatKg(WEIGHT_CURRENT)}
                </span>
                <span className="text-base font-semibold text-muted">kg</span>
              </div>
            </div>
            <Pill
              tone="success"
              icon={<ArrowDownRight size={14} aria-hidden />}
            >
              {formatKg(WEIGHT_DELTA)} kg
            </Pill>
          </div>

          <div className="-mx-1">
            <Sparkline
              points={[...WEIGHT_SERIES]}
              height={88}
              ariaLabel={`Xu hướng cân nặng 8 tuần, từ ${formatKg(
                WEIGHT_START,
              )} xuống ${formatKg(WEIGHT_CURRENT)} kg`}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-muted">
              Bắt đầu{" "}
              <span className="font-bold text-text">
                {formatKg(WEIGHT_START)} kg
              </span>
            </span>
            <span className="text-muted">
              Mục tiêu <span className="font-bold text-text">68,0 kg</span>
            </span>
          </div>
        </Card>
      </section>

      {/* Body measurements — bento StatTile grid */}
      <section aria-labelledby="measure-heading" className="flex flex-col gap-3">
        <SectionHeader id="measure-heading">Số đo cơ thể</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENTS.map((m) => (
            <StatTile
              key={m.label}
              label={m.label}
              value={m.value}
              unit={m.unit}
              icon={<m.icon size={18} aria-hidden />}
              delta={m.delta}
              deltaTone={m.deltaTone}
              className={m.wide ? "col-span-2" : "col-span-1"}
            />
          ))}
        </div>
      </section>

      {/* Streak + consistency */}
      <section aria-labelledby="streak-heading" className="flex flex-col gap-3">
        <SectionHeader id="streak-heading">Sự đều đặn</SectionHeader>

        {/* Streak highlight — gradient hero treatment */}
        <Card
          padding="lg"
          className="relative overflow-hidden border-transparent bg-primary text-primary-fg shadow-glow"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/40 blur-2xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-accent/25 blur-3xl"
          />
          <div className="relative flex items-center gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-fg/15">
              <Flame size={28} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wide opacity-90">
                Chuỗi hiện tại
              </p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold leading-none">
                  {STREAK_DAYS}
                </span>
                <span className="text-sm font-semibold opacity-90">ngày</span>
              </div>
              <p className="mt-1 text-xs opacity-90">
                Kỷ lục của bạn: {STREAK_BEST} ngày — cố lên!
              </p>
            </div>
          </div>
        </Card>

        {/* Workouts per week */}
        <Card padding="lg" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <IconBadge tone="accent" size="sm">
                <Target size={18} aria-hidden />
              </IconBadge>
              <div>
                <p className="text-sm font-bold text-text">
                  Buổi tập mỗi tuần
                </p>
                <p className="text-xs text-muted">6 tuần gần nhất</p>
              </div>
            </div>
            <Pill tone="muted">Mục tiêu {WORKOUT_GOAL}/tuần</Pill>
          </div>
          <MiniBarChart
            data={WEEKLY_WORKOUTS}
            goal={WORKOUT_GOAL}
            ariaLabel="Số buổi tập mỗi tuần trong 6 tuần gần nhất, đường mục tiêu 4 buổi"
          />
        </Card>
      </section>

      {/* Achievements */}
      <section aria-labelledby="awards-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="awards-heading"
          action={
            <span className="text-xs font-bold text-primary">
              {EARNED_COUNT}/{ACHIEVEMENTS.length}
            </span>
          }
        >
          Thành tích
        </SectionHeader>
        <div className="flex flex-col gap-3">
          {ACHIEVEMENTS.map((achievement) => (
            <AchievementRow
              key={achievement.title}
              achievement={achievement}
            />
          ))}
        </div>
      </section>

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        Số liệu cập nhật hằng ngày · FitVN
      </footer>
    </main>
  );
}
