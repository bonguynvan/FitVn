"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Droplet,
  Flame,
  Minus,
  Moon,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/nav/PageHeader";
import { Card, IconBadge, Pill, ProgressRing, SectionHeader, Sheet } from "@/components/ui";
import { type SeedFood } from "@/lib/data/foods-seed";
import { addCustomFood, useAllFoods, useRecentFoods } from "@/lib/store/food-store";
import { useDailyTargets } from "@/lib/store/profile-store";
import { setWaterGoal, useWaterGoal } from "@/lib/store/preferences-store";
import { addDaysIso, longDateVi, shortDateVi, todayIso } from "@/lib/date";
import { fmtNum } from "@/lib/format";
import {
  addFood,
  removeFood,
  setWater,
  updateFood,
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
  const [dateIso, setDateIso] = useState(today);
  const isToday = dateIso === today;
  const dateLabel = isToday
    ? "Hôm nay"
    : dateIso === addDaysIso(today, -1)
      ? "Hôm qua"
      : longDateVi(dateIso);
  const foods = useDayFoods(dateIso);
  const water = useWater(dateIso);
  const targets = useDailyTargets();
  const waterGoal = useWaterGoal();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<LoggedFood | null>(null);

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

  const remaining = Math.max(targets.calories - totals.cal, 0);
  const macros = [
    { label: "Đạm", value: totals.protein, target: targets.proteinG },
    { label: "Tinh bột", value: totals.carbs, target: targets.carbsG },
    { label: "Chất béo", value: totals.fat, target: targets.fatG },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <PageHeader
        eyebrow="Dinh dưỡng"
        title="Hôm nay ăn gì"
        subtitle={
          foods.length > 0
            ? `Còn lại ${fmt(remaining)} kcal`
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

      {/* Date switcher — log/view any day (no future) */}
      <div className="flex items-center justify-between gap-2 rounded-card border border-border bg-surface p-2">
        <button
          type="button"
          aria-label="Ngày trước"
          onClick={() => setDateIso((d) => addDaysIso(d, -1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-raised hover:text-text active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-sm font-semibold text-text">{dateLabel}</span>
          {isToday ? (
            <span className="text-xs text-muted">{shortDateVi(dateIso)}</span>
          ) : (
            <button
              type="button"
              onClick={() => setDateIso(today)}
              className="text-xs font-semibold text-primary"
            >
              Về hôm nay
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Ngày sau"
          onClick={() => setDateIso((d) => addDaysIso(d, 1))}
          disabled={isToday}
          className="inline-flex h-9 w-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-raised hover:text-text active:scale-95 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day summary */}
      <Card raised padding="lg" className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={totals.cal}
            max={targets.calories}
            size={116}
            stroke={12}
            label={`${fmt(totals.cal)} trên ${fmt(targets.calories)} kcal`}
          >
            <Flame size={20} className="text-primary" aria-hidden />
            <span className="mt-0.5 text-xl font-semibold leading-none text-text">
              {fmt(totals.cal)}
            </span>
            <span className="text-[11px] font-medium text-muted">
              / {fmt(targets.calories)} kcal
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
                    <span className="font-semibold text-text">{fmtNum(m.value)}</span>
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
            <Pill tone={water >= waterGoal ? "success" : "accent"}>
              {water}/{waterGoal} ly
            </Pill>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: waterGoal }).map((_, i) => {
              const filled = i < water;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Đặt ${i + 1} ly`}
                  onClick={() => setWater(dateIso, filled && water === i + 1 ? i : i + 1)}
                  className={`flex h-9 min-w-[2.25rem] flex-1 items-center justify-center rounded-btn transition-colors ${
                    filled ? "bg-primary/15 text-primary" : "bg-surface-raised text-muted"
                  }`}
                >
                  <Droplet size={16} fill={filled ? "currentColor" : "none"} />
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-medium text-muted">Mục tiêu mỗi ngày</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Giảm mục tiêu nước"
                onClick={() => setWaterGoal(waterGoal - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center text-sm font-semibold tabular-nums text-text">
                {waterGoal} ly
              </span>
              <button
                type="button"
                aria-label="Tăng mục tiêu nước"
                onClick={() => setWaterGoal(waterGoal + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* Meals */}
      <section aria-labelledby="meals-heading" className="flex flex-col gap-3">
        <SectionHeader id="meals-heading">Bữa ăn</SectionHeader>
        {MEAL_TYPES.map((mealType) => {
          const items = foods.filter((f) => f.mealType === mealType);
          if (items.length === 0) return null;
          return (
            <MealGroup
              key={mealType}
              mealType={mealType}
              items={items}
              dateIso={dateIso}
              onEdit={setEditing}
            />
          );
        })}
        {foods.length === 0 ? (
          <Card padding="lg" className="flex flex-col items-center gap-3 border-dashed text-center">
            <IconBadge tone="primary" size="lg">
              <UtensilsCrossed size={24} aria-hidden />
            </IconBadge>
            <p className="text-sm text-muted">Chưa ghi món nào.</p>
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
            addFood(dateIso, food);
            setAdding(false);
          }}
        />
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Sửa món">
        {editing ? (
          <EditFoodForm
            key={editing.id}
            food={editing}
            onSave={(patch) => {
              updateFood(dateIso, editing.id, patch);
              setEditing(null);
            }}
          />
        ) : null}
      </Sheet>
    </main>
  );
}

function MealGroup({
  mealType,
  items,
  dateIso,
  onEdit,
}: {
  mealType: MealType;
  items: LoggedFood[];
  dateIso: string;
  onEdit: (food: LoggedFood) => void;
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
          <li key={f.id} className="flex items-center justify-between gap-2 py-2">
            <button
              type="button"
              onClick={() => onEdit(f)}
              aria-label={`Sửa ${f.name}`}
              className="min-w-0 flex-1 rounded-btn px-1 py-1 text-left transition-colors hover:bg-surface-raised"
            >
              <p className="truncate text-sm font-medium text-text">{f.name}</p>
              <p className="text-xs text-muted">
                {fmtNum(f.quantity)} {f.unit} · {fmt(f.calories)} kcal
              </p>
            </button>
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

function EditFoodForm({
  food,
  onSave,
}: {
  food: LoggedFood;
  onSave: (
    patch: Pick<
      LoggedFood,
      "mealType" | "quantity" | "calories" | "protein" | "carbs" | "fat"
    >,
  ) => void;
}) {
  const [mealType, setMealType] = useState<MealType>(food.mealType);
  const [qty, setQty] = useState(food.quantity > 0 ? food.quantity : 1);

  const base = food.quantity > 0 ? food.quantity : 1;
  const preview = {
    calories: Math.round((food.calories / base) * qty),
    protein: round1((food.protein / base) * qty),
    carbs: round1((food.carbs / base) * qty),
    fat: round1((food.fat / base) * qty),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card bg-surface-raised p-3">
        <p className="text-sm font-semibold text-text">{food.name}</p>
        <p className="text-xs text-muted">Đơn vị: {food.unit}</p>
      </div>

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

      <div className="flex flex-col gap-3 rounded-card bg-surface-raised p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text">
            Số lượng ({food.unit})
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
              {fmtNum(qty)}
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
        <p className="text-xs text-muted">
          {fmt(preview.calories)} kcal · Đạm {fmtNum(preview.protein)}g · Tinh bột{" "}
          {fmtNum(preview.carbs)}g · Béo {fmtNum(preview.fat)}g
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onSave({
            mealType,
            quantity: qty,
            calories: preview.calories,
            protein: preview.protein,
            carbs: preview.carbs,
            fat: preview.fat,
          })
        }
        className="inline-flex h-12 items-center justify-center rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98]"
      >
        Lưu thay đổi
      </button>
    </div>
  );
}

function AddFoodForm({ onAdd }: { onAdd: (food: Omit<LoggedFood, "id">) => void }) {
  const allFoods = useAllFoods();
  const recentFoods = useRecentFoods();
  const [mealType, setMealType] = useState<MealType>(defaultMealByHour());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SeedFood | null>(null);
  const [qty, setQty] = useState(1);
  const [creating, setCreating] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? allFoods.filter((f) => f.name.toLowerCase().includes(q)) : allFoods).slice(0, 8);
  }, [query, allFoods]);

  function pickFood(food: SeedFood) {
    setSelected(food);
    setQuery("");
  }

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

      {/* Recently logged */}
      {recentFoods.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted">Gần đây</span>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {recentFoods.map((f) => {
              const active = selected?.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => pickFood(f)}
                  className={`shrink-0 rounded-pill border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-text hover:border-primary/40"
                  }`}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

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

      {/* Create custom food */}
      {creating ? (
        <CreateFoodForm
          onCancel={() => setCreating(false)}
          onCreate={(draft) => {
            const newFood = addCustomFood(draft);
            pickFood(newFood);
            setCreating(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center justify-center gap-2 rounded-btn border border-dashed border-border bg-surface px-4 py-3 text-sm font-semibold text-muted transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus size={16} /> Tạo món mới
        </button>
      )}

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
                {fmtNum(qty)}
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
              {fmt(preview.calories)} kcal · Đạm {fmtNum(preview.protein)}g · Tinh bột{" "}
              {fmtNum(preview.carbs)}g · Béo {fmtNum(preview.fat)}g
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

const CREATE_FIELDS: ReadonlyArray<{
  key: keyof Omit<SeedFood, "id" | "name" | "unit">;
  label: string;
}> = [
  { key: "calories", label: "Calo (kcal)" },
  { key: "protein", label: "Đạm (g)" },
  { key: "carbs", label: "Tinh bột (g)" },
  { key: "fat", label: "Béo (g)" },
];

function CreateFoodForm({
  onCreate,
  onCancel,
}: {
  onCreate: (food: Omit<SeedFood, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("phần");
  const [macros, setMacros] = useState({ calories: "", protein: "", carbs: "", fat: "" });

  const num = (v: string) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const trimmedName = name.trim();
  const valid = trimmedName.length > 0 && num(macros.calories) >= 0;

  function save() {
    if (!valid) return;
    onCreate({
      name: trimmedName,
      unit: unit.trim() || "phần",
      calories: num(macros.calories),
      protein: num(macros.protein),
      carbs: num(macros.carbs),
      fat: num(macros.fat),
    });
  }

  const inputClass =
    "w-full rounded-btn border border-border bg-surface px-3 py-2.5 text-base text-text outline-none placeholder:text-muted focus:border-primary";

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-raised p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">Món mới</span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Hủy tạo món"
          className="inline-flex h-8 w-8 items-center justify-center rounded-btn text-muted transition hover:bg-surface hover:text-text"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên món"
          className={inputClass}
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Đơn vị"
          aria-label="Đơn vị"
          className={`${inputClass} w-24`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CREATE_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-muted">
            {field.label}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={macros[field.key]}
              onChange={(e) =>
                setMacros((m) => ({ ...m, [field.key]: e.target.value }))
              }
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
        className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        <Check size={16} /> Lưu món
      </button>
    </div>
  );
}
