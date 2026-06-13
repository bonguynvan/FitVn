"use client";

import { ChefHat, Trash2 } from "lucide-react";

import { Card, IconBadge, SectionHeader } from "@/components/ui";
import { removeCustomFood, useCustomFoods } from "@/lib/store/food-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

/**
 * "Món tùy chỉnh" — manage the foods the user created (view + delete). Hidden
 * until at least one custom food exists. Light: reads only the custom-foods key,
 * not the bundled catalog.
 */
export function CustomFoods() {
  const foods = useCustomFoods();
  if (foods.length === 0) return null;

  return (
    <section aria-labelledby="custom-foods-heading" className="flex flex-col gap-3">
      <SectionHeader id="custom-foods-heading">Món tùy chỉnh</SectionHeader>
      <Card padding="md">
        <ul className="flex flex-col divide-y divide-border">
          {foods.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2.5">
              <IconBadge tone="muted" size="sm">
                <ChefHat size={16} aria-hidden />
              </IconBadge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{f.name}</p>
                <p className="text-xs text-muted">
                  {fmt(f.per100g.calories)} kcal/100g · {fmt(f.serving.grams)}g/{f.serving.unit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeCustomFood(f.id)}
                aria-label={`Xóa ${f.name}`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
