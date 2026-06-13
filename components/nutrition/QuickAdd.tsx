"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Zap } from "lucide-react";

import { SectionHeader } from "@/components/ui";
import { fmtNum } from "@/lib/format";
import { defaultMealByHour } from "@/lib/nutrition/meal-time";
import {
  computeQuickAddSuggestions,
  type QuickAddTemplate,
} from "@/lib/nutrition/quick-add";
import { addFood, useNutritionHistory } from "@/lib/store/nutrition-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const ADDED_FLASH_MS = 1500;

/**
 * One-tap re-log of the foods you log most often, at your usual portion. Logs
 * into the current day under the meal-type that fits the time of day.
 */
export function QuickAdd({ dateIso }: { dateIso: string }) {
  const history = useNutritionHistory();
  const suggestions = useMemo(
    () => computeQuickAddSuggestions(history, 6),
    [history],
  );
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  if (suggestions.length === 0) return null;

  function onAdd(key: string, template: QuickAddTemplate) {
    addFood(dateIso, { ...template, mealType: defaultMealByHour() });
    setAdded((prev) => new Set(prev).add(key));
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(
      key,
      setTimeout(() => {
        setAdded((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        timers.current.delete(key);
      }, ADDED_FLASH_MS),
    );
  }

  return (
    <section aria-labelledby="quickadd-heading" className="flex flex-col gap-3">
      <SectionHeader id="quickadd-heading">Ghi nhanh</SectionHeader>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {suggestions.map(({ key, template }) => {
          const isAdded = added.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onAdd(key, template)}
              aria-label={`Ghi nhanh ${template.name}`}
              className={`flex shrink-0 items-center gap-2.5 rounded-card border px-3 py-2 text-left transition-colors active:scale-[0.98] ${
                isAdded
                  ? "border-success/40 bg-success/10"
                  : "border-border bg-surface hover:border-primary/40"
              }`}
            >
              <div className="min-w-0">
                <p className="max-w-[11rem] truncate text-sm font-semibold text-text">
                  {template.name}
                </p>
                <p className="text-[11px] font-medium text-muted">
                  {fmtNum(template.quantity)} {template.unit} · {fmt(template.calories)} kcal
                </p>
              </div>
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-btn ${
                  isAdded ? "bg-success text-white" : "bg-primary/10 text-primary"
                }`}
              >
                {isAdded ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="-mt-1 inline-flex items-center gap-1 px-0.5 text-[11px] text-muted">
        <Zap size={12} aria-hidden /> Chạm để ghi lại món quen với khẩu phần thường dùng.
      </p>
    </section>
  );
}
