"use client";

import { useMemo, useState } from "react";
import {
  Coffee,
  Cookie,
  Droplet,
  Flame,
  Minus,
  Moon,
  Plus,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/nav/PageHeader";
import { Card, IconBadge, Pill, ProgressRing, SectionHeader, Sheet } from "@/components/ui";
import { SEED_FOODS, type SeedFood } from "@/lib/data/foods-seed";
import { DAILY_TARGETS, WATER_GOAL_CUPS } from "@/lib/config/targets";
import { todayIso } from "@/lib/date";
import {
  addFood,
  removeFood,
  setWater,
  useDayFoods,
  useWater,
} from "@/lib/store/nutrition-store";
import {
  MEAL_LABEL_VI,
  MEAL_TYPES,
  type LoggedFood,
  type MealType,
} from "@/lib/store/types";

const MEAL_ICON: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: Moon,
  snack: Cookie,
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

function defaultMealByHour(): MealType {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function NutritionScreen() {
  const today = todayIso();
  const foods = useDayFoods(today);
  const water = useWater(today);
  const [adding, setAdding] = useState(false);

  const totals = useMemo(
    () =>
      foods.reduce(
        (a, f) => ({
          cal: a.cal + f.calories,
          protein: a.protein + f.protein,
          carbs: a.carbs + f.carbs,
          fat: a.fat + f.fat,
        }),
        { cal: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [foods],
  );

  const remaining = Math.max(DAILY_TARGETS.calories - totals.cal, 0);
  const macros = [
    { label: "Đạm", value: totals.protein, target: DAILY_TARGETS.proteinG },
    { label: "Tinh bột", value: totals.carbs, target: DAILY_TARGETS.carbsG },
    { label: "Chất béo", value: totals.fat, target: DAILY_TARGETS.fatG },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <PageHeader
        eyebrow="Dinh dưỡng"
        title="Hôm nay ăn gì"
        subtitle={
          foods.length > 0
            ? `Còn lại ${fmt(remaining)} kcal cho hôm nay`
            : "Ghi món để theo dõi calo và macro"
        }
        action={
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Ghi bữa ăn"
            className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-primary text-primary-fg shadow-glow transition-transform active:scale-95"
          >
            <Plus size={22} />
          </button>
        }
      />

      {/* Day summary */}
      <Card raised padding="lg" className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={totals.cal}
            max={DAILY_TARGETS.calories}
            size={116}
            stroke={12}
            label={`${fmt(totals.cal)} trên ${fmt(DAILY_TARGETS.calories)} kcal`}
          >
            <Flame size={20} className="text-primary" aria-hidden />
            <span className="mt-0.5 text-xl font-semibold leading-none text-text">
              {fmt(totals.cal)}
            </span>
            <span className="text-[11px] font-medium text-muted">
              / {fmt(DAILY_TARGETS.calories)} kcal
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <Pill tone={remaining > 0 ? "accent" : "success"}>
              {remaining > 0 ? `Còn ${fmt(remaining)} kcal` : "Đã đạt mục tiêu"}
            </Pill>
            <p className="mt-2 text-sm leading-snug text-muted">
              {foods.length > 0
                ? "Tiếp tục cân đối các bữa trong ngày nhé."
                : "Chưa có món nào. Nhấn + để ghi bữa đầu tiên."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {macros.map((m) => {
            const ratio = m.target > 0 ? Math.min(m.value / m.target, 1) : 0;
            return (
              <div key={m.label} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-text">{m.label}</span>
                  <span className="text-muted">
                    <span className="font-semibold text-text">{round1(m.value)}</span>
                    {" / "}
                    {m.target}g
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-surface-raised">
                  <div
                    className="h-full rounded-pill bg-primary"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Water */}
      <section aria-labelledby="water-heading" className="flex flex-col gap-3">
        <SectionHeader id="water-heading">Nước uống</SectionHeader>
        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text">Uống nước</span>
            <Pill tone={water >= WATER_GOAL_CUPS ? "success" : "accent"}>
              {water}/{WATER_GOAL_CUPS} ly
            </Pill>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: WATER_GOAL_CUPS }).map((_, i) => {
              const filled = i < water;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Đặt ${i + 1} ly`}
                  onClick={() => setWater(today, filled && water === i + 1 ? i : i + 1)}
                  className={`flex h-9 flex-1 items-center justify-center rounded-btn transition-colors ${
                    filled ? "bg-primary/15 text-primary" : "bg-surface-raised text-muted"
                  }`}
                >
                  <Droplet size={16} fill={filled ? "currentColor" : "none"} />
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Meals */}
      <section aria-labelledby="meals-heading" className="flex flex-col gap-3">
        <SectionHeader id="meals-heading">Bữa ăn hôm nay</SectionHeader>
        {MEAL_TYPES.map((mealType) => {
          const items = foods.filter((f) => f.mealType === mealType);
          if (items.length === 0) return null;
          return (
            <MealGroup key={mealType} mealType={mealType} items={items} dateIso={today} />
          );
        })}
        {foods.length === 0 ? (
          <Card padding="lg" className="flex flex-col items-center gap-3 border-dashed text-center">
            <IconBadge tone="primary" size="lg">
              <UtensilsCrossed size={24} aria-hidden />
            </IconBadge>
            <p className="text-sm text-muted">Chưa ghi món nào hôm nay.</p>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
            >
              <Plus size={16} /> Ghi bữa ăn
            </button>
          </Card>
        ) : null}
      </section>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Ghi bữa ăn">
        <AddFoodForm
          onAdd={(food) => {
            addFood(today, food);
            setAdding(false);
          }}
        />
      </Sheet>
    </main>
  );
}

function MealGroup({
  mealType,
  items,
  dateIso,
}: {
  mealType: MealType;
  items: LoggedFood[];
  dateIso: string;
}) {
  const Icon = MEAL_ICON[mealType];
  const subtotal = items.reduce((a, f) => a + f.calories, 0);
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconBadge tone="primary" size="sm">
            <Icon size={16} aria-hidden />
          </IconBadge>
          <span className="text-sm font-semibold text-text">
            {MEAL_LABEL_VI[mealType]}
          </span>
        </div>
        <Pill tone="muted">{fmt(subtotal)} kcal</Pill>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{f.name}</p>
              <p className="text-xs text-muted">
                {round1(f.quantity)} {f.unit} · {fmt(f.calories)} kcal
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeFood(dateIso, f.id)}
              aria-label={`Xóa ${f.name}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AddFoodForm({ onAdd }: { onAdd: (food: Omit<LoggedFood, "id">) => void }) {
  const [mealType, setMealType] = useState<MealType>(defaultMealByHour());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SeedFood | null>(null);
  const [qty, setQty] = useState(1);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? SEED_FOODS.filter((f) => f.name.toLowerCase().includes(q)) : SEED_FOODS).slice(0, 8);
  }, [query]);

  const preview = selected
    ? {
        calories: Math.round(selected.calories * qty),
        protein: round1(selected.protein * qty),
        carbs: round1(selected.carbs * qty),
        fat: round1(selected.fat * qty),
      }
    : null;

  function submit() {
    if (!selected) return;
    onAdd({
      foodId: selected.id,
      name: selected.name,
      mealType,
      quantity: qty,
      unit: selected.unit,
      calories: Math.round(selected.calories * qty),
      protein: round1(selected.protein * qty),
      carbs: round1(selected.carbs * qty),
      fat: round1(selected.fat * qty),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Meal type */}
      <div className="grid grid-cols-4 gap-1.5">
        {MEAL_TYPES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMealType(m)}
            className={`rounded-btn py-2 text-xs font-semibold transition-colors ${
              mealType === m
                ? "bg-primary text-primary-fg"
                : "bg-surface-raised text-muted"
            }`}
          >
            {MEAL_LABEL_VI[m]}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm món ăn…"
        className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
      />

      {/* Food list */}
      <ul className="flex max-h-52 flex-col gap-1 overflow-y-auto">
        {matches.map((f) => {
          const active = selected?.id === f.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setSelected(f)}
                className={`flex w-full items-center justify-between gap-3 rounded-btn border px-3 py-2.5 text-left transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <span className="text-sm font-medium text-text">{f.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {f.calories} kcal/{f.unit}
                </span>
              </button>
            </li>
          );
        })}
        {matches.length === 0 ? (
          <li className="py-2 text-center text-sm text-muted">Không tìm thấy món.</li>
        ) : null}
      </ul>

      {/* Quantity + preview + submit */}
      {selected ? (
        <div className="flex flex-col gap-3 rounded-card bg-surface-raised p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text">
              Số lượng ({selected.unit})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Giảm"
                onClick={() => setQty((q) => Math.max(0.5, round1(q - 0.5)))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-base font-semibold text-text">
                {round1(qty)}
              </span>
              <button
                type="button"
                aria-label="Tăng"
                onClick={() => setQty((q) => round1(q + 0.5))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          {preview ? (
            <p className="text-xs text-muted">
              {fmt(preview.calories)} kcal · Đạm {preview.protein}g · Tinh bột{" "}
              {preview.carbs}g · Béo {preview.fat}g
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={!selected}
        className="inline-flex h-12 items-center justify-center rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        Thêm vào nhật ký
      </button>
    </div>
  );
}
