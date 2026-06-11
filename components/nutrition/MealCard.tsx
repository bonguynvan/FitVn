import { Plus, type LucideIcon } from "lucide-react";

import { Card, IconBadge, Pill } from "@/components/ui";

/**
 * MealCard — a single meal section (Bữa sáng / trưa / tối / phụ).
 *
 * Lists logged Vietnamese foods (name + portion + kcal), shows a kcal subtotal
 * in the header, and exposes a non-functional "+ Thêm món" affordance. Pure
 * presentational Server Component built on the shared Card/IconBadge/Pill
 * primitives so it stays cohesive with the home screen. No network, no state.
 */

export interface FoodItem {
  /** Dish name, e.g. "Phở bò tái". */
  readonly name: string;
  /** Portion description, e.g. "1 tô" or "150g". */
  readonly portion: string;
  /** Energy in kilocalories. */
  readonly kcal: number;
}

export interface Meal {
  /** Meal label, e.g. "Bữa sáng". */
  readonly title: string;
  /** Suggested time window, e.g. "06:30 - 08:00". */
  readonly time: string;
  /** Leading lucide icon for the meal. */
  readonly icon: LucideIcon;
  /** Icon badge tone. */
  readonly tone: "primary" | "accent" | "success" | "muted";
  /** Logged foods for this meal. */
  readonly items: ReadonlyArray<FoodItem>;
}

function formatKcal(n: number): string {
  return n.toLocaleString("vi-VN");
}

interface MealCardProps {
  meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
  const Icon = meal.icon;
  const subtotal = meal.items.reduce((sum, item) => sum + item.kcal, 0);

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      {/* Header: icon + title/time on the left, kcal subtotal on the right */}
      <div className="flex items-center gap-3">
        <IconBadge tone={meal.tone} size="md">
          <Icon size={22} aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-text">{meal.title}</h3>
          <p className="text-xs font-medium tracking-wide text-muted">
            {meal.time}
          </p>
        </div>
        <Pill tone="primary">{formatKcal(subtotal)} kcal</Pill>
      </div>

      {/* Logged foods */}
      <ul className="flex flex-col">
        {meal.items.map((item, index) => (
          <li
            key={item.name}
            className={`flex items-baseline justify-between gap-3 py-2.5 ${
              index > 0 ? "border-t border-border" : ""
            }`}
          >
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text">
                {item.name}
              </span>
              <span className="text-xs text-muted">{item.portion}</span>
            </div>
            <span className="shrink-0 text-sm font-bold text-text">
              {formatKcal(item.kcal)}
              <span className="ml-1 text-xs font-medium text-muted">kcal</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Non-functional add affordance (UI only) */}
      <button
        type="button"
        className="inline-flex items-center justify-center gap-1.5 rounded-btn border border-dashed border-border bg-surface py-2.5 text-sm font-semibold text-muted transition-colors hover:border-primary/60 hover:text-primary active:scale-[0.99]"
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden />
        Thêm món
      </button>
    </Card>
  );
}
