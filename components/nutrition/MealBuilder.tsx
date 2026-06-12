"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

import { Stepper } from "@/components/ui";
import type { FoodItem } from "@/lib/data/foods-db";
import { useAllFoods } from "@/lib/store/food-store";
import {
  addSavedMeal,
  updateSavedMeal,
  type SavedMeal,
  type SavedMealItem,
} from "@/lib/store/meal-store";
import { round1, scaleFood } from "@/lib/nutrition/scale";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const fmtNum = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN");

interface BuilderItem {
  food: FoodItem;
  /** Quantity in servings. */
  qty: number;
}

/** Convert a builder item into the persisted, scaled SavedMealItem. */
function toSavedItem({ food, qty }: BuilderItem): SavedMealItem {
  const grams = qty * food.serving.grams;
  return {
    foodId: food.id,
    name: food.name,
    quantity: qty,
    unit: food.serving.unit,
    grams: round1(grams),
    ...scaleFood(food, grams),
  };
}

/** Compose and save a reusable multi-food meal (create or edit). */
export function MealBuilder({
  onDone,
  editing,
}: {
  onDone: () => void;
  editing?: SavedMeal;
}) {
  const allFoods = useAllFoods();
  const [name, setName] = useState(editing?.name ?? "");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<BuilderItem[]>(() => {
    if (!editing) return [];
    // Rebuild builder items by resolving each saved item's foodId; drop any
    // food that no longer exists (e.g. a deleted custom food).
    const byId = new Map(allFoods.map((f) => [f.id, f]));
    return editing.items
      .map((it) => {
        const food = it.foodId ? byId.get(it.foodId) : undefined;
        return food ? { food, qty: it.quantity > 0 ? it.quantity : 1 } : null;
      })
      .filter((x): x is BuilderItem => x !== null);
  });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allFoods
      .filter((f) => f.name.toLowerCase().includes(q) || f.nameEn.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, allFoods]);

  function addFood(food: FoodItem) {
    setItems((list) => {
      const existing = list.find((i) => i.food.id === food.id);
      if (existing) {
        return list.map((i) =>
          i.food.id === food.id ? { ...i, qty: round1(i.qty + 1) } : i,
        );
      }
      return [...list, { food, qty: 1 }];
    });
    setQuery("");
  }

  function setQty(id: string, qty: number) {
    setItems((list) =>
      list.map((i) => (i.food.id === id ? { ...i, qty: Math.max(0.5, round1(qty)) } : i)),
    );
  }

  function remove(id: string) {
    setItems((list) => list.filter((i) => i.food.id !== id));
  }

  const totals = useMemo(
    () =>
      items.reduce(
        (a, { food, qty }) => {
          const s = scaleFood(food, qty * food.serving.grams);
          return {
            cal: a.cal + s.calories,
            protein: a.protein + s.protein,
            carbs: a.carbs + s.carbs,
            fat: a.fat + s.fat,
          };
        },
        { cal: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [items],
  );

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && items.length > 0;

  function save() {
    if (!canSave) return;
    const saved = items.map(toSavedItem);
    if (editing) updateSavedMeal(editing.id, trimmedName, saved);
    else addSavedMeal(trimmedName, saved);
    onDone();
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên bữa (vd: Bữa sáng của tôi)"
        className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
      />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Thêm món vào bữa (VN / EN)…"
        className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
      />

      {matches.length > 0 ? (
        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
          {matches.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => addFood(f)}
                className="flex w-full items-center justify-between gap-3 rounded-btn border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text">{f.name}</span>
                  <span className="block truncate text-[11px] text-muted">{f.nameEn}</span>
                </span>
                <Plus size={16} className="shrink-0 text-primary" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Selected items */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-card bg-surface-raised p-3">
          {items.map(({ food, qty }) => {
            const s = scaleFood(food, qty * food.serving.grams);
            return (
              <div key={food.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{food.name}</p>
                  <p className="text-xs text-muted">
                    {fmtNum(qty)} {food.serving.unit} · {fmt(s.calories)} kcal
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Stepper
                    value={qty}
                    onChange={(v) => setQty(food.id, v)}
                    step={0.5}
                    min={0.5}
                    ariaLabel={food.name}
                    format={fmtNum}
                    valueClassName="w-8"
                  />
                  <button
                    type="button"
                    aria-label={`Xóa ${food.name}`}
                    onClick={() => remove(food.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-btn text-muted transition hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="border-t border-border pt-2 text-xs text-muted">
            Tổng: <span className="font-semibold text-text">{fmt(totals.cal)} kcal</span> · Đạm{" "}
            {fmtNum(totals.protein)}g · Tinh bột {fmtNum(totals.carbs)}g · Béo {fmtNum(totals.fat)}g
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-muted">Tìm và thêm món để tạo bữa.</p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!canSave}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        <Check size={16} /> {editing ? "Lưu thay đổi" : "Lưu bữa"}
      </button>
    </div>
  );
}
