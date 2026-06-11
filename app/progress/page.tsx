import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  Flame,
  HeartPulse,
  LineChart,
  Medal,
  Ruler,
  Scale,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  EmptyState,
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
  type AchievementTone,
} from "@/components/progress/AchievementRow";
import { PageHeader } from "@/components/nav/PageHeader";
import {
  getProgress,
  type AchievementId,
  type MeasurementId,
  type MeasurementStat,
  type ProgressData,
} from "@/lib/data/progress";

/**
 * Progress — weight trend, body measurements, streak/consistency, and
 * achievement badges.
 *
 * Async Server Component: reads its snapshot from the gated data layer
 * (`getProgress`) which returns EMPTY until Supabase is wired up. With no data
 * it shows a polished empty state; once measurements/sessions exist it renders
 * the rich bento layout. Mirrors the home screen's visual language — signature
 * coral→orange gradient accents, big bold stat numbers vs small uppercase muted
 * labels, lucide icons only. No client state.
 */

export const metadata: Metadata = {
  title: "Tiến độ",
  description:
    "Theo dõi cân nặng, số đo cơ thể, chuỗi ngày tập luyện và thành tích của bạn.",
};

// --- Static presentation catalogs ------------------------------------------
// The data layer is icon-free and keyed by stable ids; the page owns the icons,
// Vietnamese labels and fixed copy and maps ids → presentation.

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

/** Per-measurement icon + display label, keyed by the data layer's id. */
const MEASUREMENT_META: Record<
  MeasurementId,
  { readonly label: string; readonly icon: LucideIcon; readonly wide?: boolean }
> = {
  weight: { label: "Cân nặng", icon: Scale, wide: true },
  body_fat: { label: "Tỷ lệ mỡ", icon: HeartPulse },
  waist: { label: "Vòng eo", icon: Ruler },
  chest: { label: "Vòng ngực", icon: Ruler },
};

/** Fixed achievement catalog (icon + tone + copy), keyed by the data layer's id. */
const ACHIEVEMENT_META: Record<
  AchievementId,
  {
    readonly icon: LucideIcon;
    readonly title: string;
    readonly description: string;
    readonly tone: AchievementTone;
  }
> = {
  streak_7: {
    icon: Flame,
    title: "Chuỗi 7 ngày",
    description: "Tập đều 7 ngày liên tiếp không nghỉ.",
    tone: "primary",
  },
  protein_goal: {
    icon: Target,
    title: "Đạt mục tiêu đạm",
    description: "Đủ lượng đạm mục tiêu 5 ngày liên tiếp.",
    tone: "accent",
  },
  first_kg: {
    icon: Medal,
    title: "Giảm 1kg đầu tiên",
    description: "Giảm được 1kg so với cân nặng ban đầu.",
    tone: "success",
  },
  streak_30: {
    icon: Trophy,
    title: "Chuỗi 30 ngày",
    description: "Duy trì chuỗi tập luyện 30 ngày liên tiếp.",
    tone: "warning",
  },
};

// --- Helpers ---------------------------------------------------------------

function formatKg(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

// --- Page ------------------------------------------------------------------

export default async function ProgressPage() {
  const data = await getProgress();

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <div className="pt-6">
        <PageHeader
          eyebrow="Tiến độ"
          title="Hành trình của bạn"
          subtitle="Cân nặng, số đo và thành tích — tất cả trong một nơi."
        />
      </div>

      {data.hasData ? (
        <ProgressContent data={data} />
      ) : (
        <EmptyState
          icon={LineChart}
          title="Chưa có dữ liệu tiến độ"
          description="Ghi số đo đầu tiên để FitVN vẽ biểu đồ cân nặng, theo dõi sự đều đặn và mở khóa thành tích cho bạn."
          action={
            <Link
              href="/progress/new"
              className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
            >
              <Scale size={16} aria-hidden />
              Ghi số đo
            </Link>
          }
        />
      )}

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        Số liệu cập nhật hằng ngày · FitVN
      </footer>
    </main>
  );
}

/** Data-present layout: weight trend, measurements, consistency, achievements. */
function ProgressContent({ data }: { data: ProgressData }) {
  const { weight, measurements, consistency, achievements } = data;
  const weightSeries = weight.series.map((p) => p.weightKg);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <>
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
                  {weight.currentKg != null ? formatKg(weight.currentKg) : "—"}
                </span>
                <span className="text-base font-semibold text-muted">kg</span>
              </div>
            </div>
            {weight.deltaKg != null ? (
              <Pill
                tone={weight.deltaKg <= 0 ? "success" : "muted"}
                icon={
                  weight.deltaKg <= 0 ? (
                    <ArrowDownRight size={14} aria-hidden />
                  ) : undefined
                }
              >
                {formatKg(weight.deltaKg)} kg
              </Pill>
            ) : null}
          </div>

          {weightSeries.length >= 2 ? (
            <div className="-mx-1">
              <Sparkline
                points={weightSeries}
                height={88}
                ariaLabel={
                  weight.startKg != null && weight.currentKg != null
                    ? `Xu hướng cân nặng, từ ${formatKg(
                        weight.startKg,
                      )} xuống ${formatKg(weight.currentKg)} kg`
                    : "Xu hướng cân nặng"
                }
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-muted">
              Bắt đầu{" "}
              <span className="font-bold text-text">
                {weight.startKg != null ? formatKg(weight.startKg) : "—"} kg
              </span>
            </span>
            <span className="text-muted">
              Mục tiêu{" "}
              <span className="font-bold text-text">
                {weight.goalKg != null ? formatKg(weight.goalKg) : "—"} kg
              </span>
            </span>
          </div>
        </Card>
      </section>

      {/* Body measurements — bento StatTile grid */}
      <section aria-labelledby="measure-heading" className="flex flex-col gap-3">
        <SectionHeader id="measure-heading">Số đo cơ thể</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          {measurements.map((m: MeasurementStat) => {
            const meta = MEASUREMENT_META[m.id];
            const Icon = meta.icon;
            return (
              <StatTile
                key={m.id}
                label={meta.label}
                value={m.value}
                unit={m.unit}
                icon={<Icon size={18} aria-hidden />}
                delta={m.delta || undefined}
                deltaTone={m.deltaTone}
                className={meta.wide ? "col-span-2" : "col-span-1"}
              />
            );
          })}
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
                  {consistency.currentStreakDays}
                </span>
                <span className="text-sm font-semibold opacity-90">ngày</span>
              </div>
              <p className="mt-1 text-xs opacity-90">
                Kỷ lục của bạn: {consistency.bestStreakDays} ngày — cố lên!
              </p>
            </div>
          </div>
        </Card>

        {/* Workouts per week */}
        {consistency.weekly.length > 0 ? (
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
              <Pill tone="muted">Mục tiêu {consistency.weeklyGoal}/tuần</Pill>
            </div>
            <MiniBarChart
              data={[...consistency.weekly]}
              goal={consistency.weeklyGoal}
              ariaLabel={`Số buổi tập mỗi tuần trong 6 tuần gần nhất, đường mục tiêu ${consistency.weeklyGoal} buổi`}
            />
          </Card>
        ) : null}
      </section>

      {/* Achievements */}
      <section aria-labelledby="awards-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="awards-heading"
          action={
            <span className="text-xs font-bold text-primary">
              {earnedCount}/{achievements.length}
            </span>
          }
        >
          Thành tích
        </SectionHeader>
        <div className="flex flex-col gap-3">
          {achievements.map((status) => {
            const meta = ACHIEVEMENT_META[status.id];
            const achievement: Achievement = {
              icon: meta.icon,
              title: meta.title,
              description: meta.description,
              tone: meta.tone,
              earned: status.earned,
              meta: status.meta,
            };
            return (
              <AchievementRow key={status.id} achievement={achievement} />
            );
          })}
        </div>
      </section>
    </>
  );
}
