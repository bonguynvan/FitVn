"use client";

import { useState } from "react";
import { Check, ChefHat, Pencil, Trash2 } from "lucide-react";

import { Card, IconBadge, SectionHeader, Sheet } from "@/components/ui";
import { round1 } from "@/lib/nutrition/scale";
import {
  removeCustomFood,
  updateCustomFood,
  useCustomFoods,
} from "@/lib/store/food-store";
import type { FoodItem } from "@/lib/data/foods-db";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

/**
 * "Món tùy chỉnh" — manage the foods the user created (view, edit, delete).
 * Hidden until at least one custom food exists. Light: reads only the
 * custom-foods key, not the bundled catalog.
 */
export function CustomFoods() {
  const foods = useCustomFoods();
  const [editing, setEditing] = useState<FoodItem | null>(null);
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
                onClick={() => setEditing(f)}
                aria-label={`Sửa ${f.name}`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-text"
              >
                <Pencil size={15} />
              </button>
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

      <Sheet open={editing != null} onClose={() => setEditing(null)} title="Sửa món">
        {editing ? (
          <EditCustomFoodForm
            key={editing.id}
            food={editing}
            onSave={(draft) => {
              updateCustomFood(editing.id, draft);
              setEditing(null);
            }}
          />
        ) : null}
      </Sheet>
    </section>
  );
}

const FIELDS: ReadonlyArray<{ key: "calories" | "protein" | "carbs" | "fat"; label: string }> = [
  { key: "calories", label: "Calo (kcal)" },
  { key: "protein", label: "Đạm (g)" },
  { key: "carbs", label: "Tinh bột (g)" },
  { key: "fat", label: "Béo (g)" },
];

/** Edit a custom food. Values are entered per serving and stored per 100 g. */
function EditCustomFoodForm({
  food,
  onSave,
}: {
  food: FoodItem;
  onSave: (draft: Omit<FoodItem, "id" | "custom">) => void;
}) {
  const k = food.serving.grams / 100; // per-100g → per-serving
  const [name, setName] = useState(food.name);
  const [unit, setUnit] = useState(food.serving.unit);
  const [grams, setGrams] = useState(String(food.serving.grams));
  const [perServing, setPerServing] = useState({
    calories: String(round1(food.per100g.calories * k)),
    protein: String(round1(food.per100g.protein * k)),
    carbs: String(round1(food.per100g.carbs * k)),
    fat: String(round1(food.per100g.fat * k)),
  });

  const num = (v: string) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const trimmedName = name.trim();
  const servingGrams = Math.max(1, num(grams));
  const valid = trimmedName.length > 0 && num(perServing.calories) >= 0;
  const per100 = 100 / servingGrams; // per-serving → per 100 g

  function save() {
    if (!valid) return;
    onSave({
      name: trimmedName,
      nameEn: food.nameEn || trimmedName,
      group: food.group,
      refusePct: food.refusePct,
      serving: { unit: unit.trim() || "phần", grams: servingGrams },
      per100g: {
        calories: round1(num(perServing.calories) * per100),
        protein: round1(num(perServing.protein) * per100),
        carbs: round1(num(perServing.carbs) * per100),
        fat: round1(num(perServing.fat) * per100),
        // Preserve any micronutrients the food already carried.
        fiber: food.per100g.fiber,
        sodiumMg: food.per100g.sodiumMg,
        calciumMg: food.per100g.calciumMg,
        ironMg: food.per100g.ironMg,
        purineMg: food.per100g.purineMg,
      },
    });
  }

  const inputClass =
    "w-full rounded-btn border border-border bg-surface px-3 py-2.5 text-base text-text outline-none placeholder:text-muted focus:border-primary";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Nhập giá trị cho 1 phần.</p>

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên món"
          aria-label="Tên món"
          className={inputClass}
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Đơn vị"
          aria-label="Đơn vị"
          className={`${inputClass} w-20`}
        />
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="g"
          aria-label="Gram mỗi phần"
          className={`${inputClass} w-16`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-muted">
            {field.label}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={perServing[field.key]}
              onChange={(e) => setPerServing((m) => ({ ...m, [field.key]: e.target.value }))}
              placeholder="0"
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!valid}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        <Check size={16} aria-hidden /> Lưu thay đổi
      </button>
    </div>
  );
}
