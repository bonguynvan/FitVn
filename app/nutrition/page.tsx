import type { Metadata } from "next";
import {
  Apple,
  Coffee,
  Cookie,
  Flame,
  Moon,
  Plus,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { MealCard, type Meal } from "@/components/nutrition/MealCard";
import { WaterTracker } from "@/components/nutrition/WaterTracker";
import { getNutrition, type NutritionData } from "@/lib/data/nutrition";
import type { MealType } from "@/types/database.types";
import {
  Card,
  EmptyState,
  IconBadge,
  Pill,
  ProgressRing,
  SectionHeader,
} from "@/components/ui";
import { PageHeader } from "@/components/nav/PageHeader";

/**
 * Nutrition — daily food log screen.
 *
 * Async Server Component: reads today's diary from the data layer
 * (`getNutrition`) and either shows a "no meals logged yet" empty state or the
 * rich layout — a calories ProgressRing with macro mini-bars, an 8-cup water
 * tracker, and the day's meals grouped by type with kcal subtotals. The data
 * layer returns empty until Supabase is wired up. No network here, no client
 * state, lucide icons only.
 */

export const metadata: Metadata = {
  title: "Dinh dưỡng",
};

// --- Meal presentation (static config, keyed by meal type) ------------------
// Icon, badge tone, label and suggested time window are presentation concerns;
// the logged foods come from the data layer and are bound in below.

interface MealPresentation {
  readonly title: string;
  readonly time: string;
  readonly icon: LucideIcon;
  readonly tone: Meal["tone"];
}

const MEAL_PRESENTATION: Record<MealType, MealPresentation> = {
  breakfast: { title: "Bữa sáng", time: "06:30 - 08:00", icon: Coffee, tone: "primary" },
  lunch: { title: "Bữa trưa", time: "11:30 - 13:00", icon: UtensilsCrossed, tone: "accent" },
  dinner: { title: "Bữa tối", time: "18:30 - 20:00", icon: Moon, tone: "success" },
  snack: { title: "Bữa phụ", time: "Trong ngày", icon: Cookie, tone: "muted" },
};

// --- Helpers ---------------------------------------------------------------

function formatKcal(n: number): string {
  return n.toLocaleString("vi-VN");
}

const MACRO_BAR_TONE: Record<NutritionData["macros"][number]["tone"], string> = {
  primary: "bg-primary",
  accent: "bg-accent",
};

/** Today's date label in the user's timezone, e.g. "Thứ Sáu, 12/06". */
function todayLabel(): string {
  const now = new Date();
  const opts = { timeZone: "Asia/Ho_Chi_Minh" } as const;
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long", ...opts }).format(now);
  const dm = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", ...opts }).format(now);
  return `${weekday}, ${dm}`;
}

// --- Page ------------------------------------------------------------------

export default async function NutritionPage() {
  const data = await getNutrition();

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      {!data.hasData ? (
        <EmptyNutrition />
      ) : (
        <NutritionDay data={data} />
      )}
    </main>
  );
}

/** Empty state shown until the first meal of the day is logged. */
function EmptyNutrition() {
  return (
    <>
      <PageHeader
        eyebrow={todayLabel()}
        title="Dinh dưỡng"
        subtitle="Theo dõi calo và macro mỗi ngày"
        action={
          <button
            type="button"
            aria-label="Ghi món ăn"
            className="inline-flex h-11 w-11 items-center justify-center rounded-pill bg-primary text-primary-fg shadow-glow transition-transform active:scale-95"
          >
            <Plus size={22} strokeWidth={2.4} aria-hidden />
          </button>
        }
      />

      <EmptyState
        icon={UtensilsCrossed}
        title="Chưa ghi bữa ăn nào hôm nay"
        description="Ghi món đầu tiên để FitVN tính calo, macro và lượng nước cho hôm nay của bạn."
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden />
            Ghi bữa ăn
          </button>
        }
      />

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        Số liệu dinh dưỡng chỉ mang tính tham khảo
      </footer>
    </>
  );
}

/** Data-present diary: calories ring + macros, water tracker, meal list. */
function NutritionDay({ data }: { data: NutritionData }) {
  const cals = data.calories;
  const remaining = cals ? Math.max(cals.goal - cals.consumed, 0) : 0;

  // Compose MealCard props from logged foods + static presentation config,
  // keeping the breakfast → snack ordering.
  const meals: ReadonlyArray<Meal> = data.meals.map((meal) => {
    const presentation = MEAL_PRESENTATION[meal.mealType];
    return {
      title: presentation.title,
      time: presentation.time,
      icon: presentation.icon,
      tone: presentation.tone,
      items: meal.items,
    };
  });

  const totalItems = meals.reduce((count, meal) => count + meal.items.length, 0);

  return (
    <>
      <PageHeader
        eyebrow={todayLabel()}
        title="Dinh dưỡng"
        subtitle={
          cals
            ? `Còn lại ${formatKcal(remaining)} kcal cho hôm nay`
            : "Theo dõi calo và macro mỗi ngày"
        }
        action={
          <button
            type="button"
            aria-label="Ghi món ăn"
            className="inline-flex h-11 w-11 items-center justify-center rounded-pill bg-primary text-primary-fg shadow-glow transition-transform active:scale-95"
          >
            <Plus size={22} strokeWidth={2.4} aria-hidden />
          </button>
        }
      />

      {/* Day summary — calories ring + macro mini-bars */}
      {cals ? (
        <section aria-labelledby="summary-heading" className="flex flex-col gap-3">
          <SectionHeader id="summary-heading">Tổng kết ngày</SectionHeader>
          <Card raised padding="lg" className="flex flex-col gap-5">
            <div className="flex items-center gap-5">
              <ProgressRing
                value={cals.consumed}
                max={cals.goal}
                size={116}
                stroke={12}
                label={`${formatKcal(cals.consumed)} trên ${formatKcal(
                  cals.goal,
                )} kcal`}
              >
                <Flame size={20} className="text-primary" aria-hidden />
                <span className="mt-0.5 text-xl font-extrabold leading-none text-text">
                  {formatKcal(cals.consumed)}
                </span>
                <span className="text-[11px] font-medium text-muted">
                  / {formatKcal(cals.goal)} kcal
                </span>
              </ProgressRing>

              <div className="min-w-0 flex-1">
                <Pill tone="accent">Còn {formatKcal(remaining)} kcal</Pill>
                <p className="mt-2 text-sm leading-snug text-muted">
                  Bạn còn ngân sách cho một bữa phụ giàu đạm. Ưu tiên rau xanh và
                  nước nhé.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {data.macros.map((macro) => {
                const ratio =
                  macro.target > 0 ? Math.min(macro.value / macro.target, 1) : 0;
                return (
                  <div key={macro.label} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-text">
                        {macro.label}
                      </span>
                      <span className="text-muted">
                        <span className="font-bold text-text">{macro.value}</span>
                        {" / "}
                        {macro.target}
                        {macro.unit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-pill bg-surface-raised">
                      <div
                        className={`h-full rounded-pill ${MACRO_BAR_TONE[macro.tone]}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      ) : null}

      {/* Water tracker */}
      <section aria-labelledby="water-heading" className="flex flex-col gap-3">
        <SectionHeader id="water-heading">Nước uống</SectionHeader>
        <WaterTracker filled={data.water.filled} goal={data.water.goal} />
      </section>

      {/* Meals by type */}
      <section aria-labelledby="meals-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="meals-heading"
          action={
            <Pill tone="muted" icon={<Apple size={13} aria-hidden />}>
              {totalItems} món
            </Pill>
          }
        >
          Bữa ăn hôm nay
        </SectionHeader>
        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <MealCard key={meal.title} meal={meal} />
          ))}
        </div>
      </section>

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        Số liệu dinh dưỡng chỉ mang tính tham khảo
      </footer>
    </>
  );
}
