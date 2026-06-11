import type { Metadata } from "next";
import {
  Apple,
  Coffee,
  Cookie,
  Flame,
  Moon,
  Plus,
  UtensilsCrossed,
} from "lucide-react";

import { MealCard, type Meal } from "@/components/nutrition/MealCard";
import { WaterTracker } from "@/components/nutrition/WaterTracker";
import {
  Card,
  IconBadge,
  Pill,
  ProgressRing,
  SectionHeader,
} from "@/components/ui";
import { PageHeader } from "@/components/nav/PageHeader";

/**
 * Nutrition — daily food log screen.
 *
 * Server Component built entirely from mock Vietnamese data + the shared UI
 * primitives, matching the home reference visual language. Shows a calories
 * ProgressRing with macro mini-bars, an 8-cup water tracker, and the day's
 * meals grouped by type with kcal subtotals and a (non-functional) add
 * affordance. No network, no client state, lucide icons only.
 */

export const metadata: Metadata = {
  title: "Dinh dưỡng",
};

// --- Mock data (static, realistic) -----------------------------------------

const TODAY_LABEL = "Thứ Sáu, 12/06";

const CALORIES = { value: 1450, goal: 2200 } as const;

interface Macro {
  readonly label: string;
  readonly value: number;
  readonly target: number;
  readonly unit: string;
  /** Bar tone — primary for the day's core macros, accent for the "go" macro. */
  readonly tone: "primary" | "accent";
}

const MACROS: ReadonlyArray<Macro> = [
  { label: "Đạm", value: 95, target: 150, unit: "g", tone: "accent" },
  { label: "Tinh bột", value: 180, target: 250, unit: "g", tone: "primary" },
  { label: "Chất béo", value: 45, target: 70, unit: "g", tone: "primary" },
];

const WATER = { filled: 6, goal: 8 } as const;

const MEALS: ReadonlyArray<Meal> = [
  {
    title: "Bữa sáng",
    time: "06:30 - 08:00",
    icon: Coffee,
    tone: "primary",
    items: [
      { name: "Phở bò tái", portion: "1 tô", kcal: 430 },
      { name: "Cà phê sữa đá", portion: "1 ly", kcal: 120 },
    ],
  },
  {
    title: "Bữa trưa",
    time: "11:30 - 13:00",
    icon: UtensilsCrossed,
    tone: "accent",
    items: [
      { name: "Cơm tấm sườn", portion: "1 dĩa", kcal: 620 },
      { name: "Canh rau cải", portion: "1 chén", kcal: 45 },
    ],
  },
  {
    title: "Bữa tối",
    time: "18:30 - 20:00",
    icon: Moon,
    tone: "success",
    items: [
      { name: "Ức gà luộc", portion: "150g", kcal: 165 },
      { name: "Cơm trắng", portion: "1 chén", kcal: 200 },
      { name: "Rau luộc thập cẩm", portion: "1 dĩa", kcal: 60 },
    ],
  },
  {
    title: "Bữa phụ",
    time: "Trong ngày",
    icon: Cookie,
    tone: "muted",
    items: [
      { name: "Chuối", portion: "1 quả", kcal: 90 },
      { name: "Sữa tươi", portion: "1 ly", kcal: 130 },
    ],
  },
];

// --- Helpers ---------------------------------------------------------------

function formatKcal(n: number): string {
  return n.toLocaleString("vi-VN");
}

const MACRO_BAR_TONE: Record<Macro["tone"], string> = {
  primary: "bg-primary",
  accent: "bg-accent",
};

// --- Page ------------------------------------------------------------------

export default function NutritionPage() {
  const remaining = CALORIES.goal - CALORIES.value;

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <PageHeader
        eyebrow={TODAY_LABEL}
        title="Dinh dưỡng"
        subtitle={`Còn lại ${formatKcal(remaining)} kcal cho hôm nay`}
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
      <section aria-labelledby="summary-heading" className="flex flex-col gap-3">
        <SectionHeader id="summary-heading">Tổng kết ngày</SectionHeader>
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
                Bạn còn ngân sách cho một bữa phụ giàu đạm. Ưu tiên rau xanh và
                nước nhé.
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

      {/* Water tracker */}
      <section aria-labelledby="water-heading" className="flex flex-col gap-3">
        <SectionHeader id="water-heading">Nước uống</SectionHeader>
        <WaterTracker filled={WATER.filled} goal={WATER.goal} />
      </section>

      {/* Meals by type */}
      <section aria-labelledby="meals-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="meals-heading"
          action={
            <Pill tone="muted" icon={<Apple size={13} aria-hidden />}>
              {MEALS.reduce((count, meal) => count + meal.items.length, 0)} món
            </Pill>
          }
        >
          Bữa ăn hôm nay
        </SectionHeader>
        <div className="flex flex-col gap-3">
          {MEALS.map((meal) => (
            <MealCard key={meal.title} meal={meal} />
          ))}
        </div>
      </section>

      <footer className="px-1 pt-1 text-center text-xs text-muted">
        Số liệu dinh dưỡng chỉ mang tính tham khảo
      </footer>
    </main>
  );
}
