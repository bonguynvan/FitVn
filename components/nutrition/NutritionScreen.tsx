"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Droplet,
  Flame,
  Moon,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";

import { BrandHero } from "@/components/nav/BrandHero";
import {
  Card,
  IconBadge,
  Pill,
  ProgressRing,
  SectionHeader,
  SegmentedControl,
  Sheet,
  Stepper,
  Toggle,
  type SegmentOption,
} from "@/components/ui";
import { FOOD_GROUPS, type FoodItem } from "@/lib/data/foods-db";
import { round1, scaleFood } from "@/lib/nutrition/scale";
import { defaultMealByHour } from "@/lib/nutrition/meal-time";
import { SavedMeals } from "@/components/nutrition/SavedMeals";
import { addCustomFood, useAllFoods, useRecentFoods } from "@/lib/store/food-store";
import {
  CALCIUM_TARGET_MG,
  FIBER_TARGET_G,
  HIGH_PURINE_PER_100G,
  IRON_TARGET_MG,
  purineLimit,
} from "@/lib/config/targets";
import { sodiumLimitFor } from "@/lib/health/conditions";
import { useDailyTargets, useProfile } from "@/lib/store/profile-store";
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

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** Meal-type options for the SegmentedControl (shared by add + edit forms). */
const MEAL_OPTIONS: ReadonlyArray<SegmentOption<MealType>> = MEAL_TYPES.map((m) => ({
  value: m,
  label: MEAL_LABEL_VI[m],
}));

/** A food rich enough in purine to warn gout users about (per 100 g edible). */
const isHighPurine = (food: FoodItem) =>
  (food.per100g.purineMg ?? 0) >= HIGH_PURINE_PER_100G;

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
  const profile = useProfile();
  const waterGoal = useWaterGoal();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<LoggedFood | null>(null);

  const ironTarget = IRON_TARGET_MG[profile?.sex ?? "male"];
  const goutMode = profile?.goutMode ?? false;
  const purineCeiling = purineLimit(goutMode);
  const sodiumLimit = sodiumLimitFor(profile?.conditions);

  const totals = useMemo(
    () =>
      foods.reduce(
        (a, f) => ({
          cal: a.cal + f.calories,
          protein: a.protein + f.protein,
          carbs: a.carbs + f.carbs,
          fat: a.fat + f.fat,
          fiber: a.fiber + (f.fiber ?? 0),
          sodium: a.sodium + (f.sodiumMg ?? 0),
          calcium: a.calcium + (f.calciumMg ?? 0),
          iron: a.iron + (f.ironMg ?? 0),
          purine: a.purine + (f.purineMg ?? 0),
        }),
        { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, calcium: 0, iron: 0, purine: 0 },
      ),
    [foods],
  );

  const healthStats: HealthStatData[] = [
    {
      label: "Chất xơ",
      value: fmtNum(totals.fiber),
      limit: `/ ${FIBER_TARGET_G} g`,
      ratio: Math.min(totals.fiber / FIBER_TARGET_G, 1),
      tone: totals.fiber >= FIBER_TARGET_G ? "success" : "primary",
    },
    {
      label: "Natri",
      value: fmt(totals.sodium),
      limit: `/ ${fmt(sodiumLimit)} mg`,
      ratio: Math.min(totals.sodium / sodiumLimit, 1),
      tone: totals.sodium > sodiumLimit ? "danger" : "primary",
    },
    {
      label: "Canxi",
      value: fmt(totals.calcium),
      limit: `/ ${fmt(CALCIUM_TARGET_MG)} mg`,
      ratio: Math.min(totals.calcium / CALCIUM_TARGET_MG, 1),
      tone: totals.calcium >= CALCIUM_TARGET_MG ? "success" : "primary",
    },
    {
      label: "Sắt",
      value: fmtNum(totals.iron),
      limit: `/ ${ironTarget} mg`,
      ratio: Math.min(totals.iron / ironTarget, 1),
      tone: totals.iron >= ironTarget ? "success" : "primary",
    },
    {
      label: goutMode ? "Purin (chế độ gout)" : "Purin (gout)",
      value: fmt(totals.purine),
      limit: `/ ${fmt(purineCeiling)} mg`,
      ratio: Math.min(totals.purine / purineCeiling, 1),
      tone: totals.purine > purineCeiling ? "danger" : "primary",
    },
  ];

  const remaining = Math.max(targets.calories - totals.cal, 0);
  const macros = [
    { label: "Đạm", value: totals.protein, target: targets.proteinG },
    { label: "Tinh bột", value: totals.carbs, target: targets.carbsG },
    { label: "Chất béo", value: totals.fat, target: targets.fatG },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <BrandHero
        eyebrow="Dinh dưỡng"
        title="Nhật ký ăn uống"
        subtitle={
          foods.length > 0
            ? `Còn lại ${fmt(remaining)} kcal`
            : "Ghi món để theo dõi calo, macro và vi chất"
        }
        action={
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Ghi bữa ăn"
            className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-white/20 text-primary-fg active:scale-95"
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

      {/* Health checks: fiber, sodium, micronutrients, purine */}
      <section aria-labelledby="health-heading" className="flex flex-col gap-3">
        <SectionHeader id="health-heading">Vi chất &amp; sức khỏe</SectionHeader>
        <Card padding="lg" className="grid grid-cols-2 gap-x-4 gap-y-4">
          {healthStats.map((s) => (
            <HealthStat key={s.label} {...s} />
          ))}
        </Card>
      </section>

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
            <Stepper
              value={waterGoal}
              onChange={setWaterGoal}
              step={1}
              min={1}
              ariaLabel="mục tiêu nước"
              format={(n) => `${n} ly`}
              valueClassName="w-12"
            />
          </div>
        </Card>
      </section>

      {/* Saved meals — one-tap logging + builder */}
      <SavedMeals dateIso={dateIso} />

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
          goutMode={goutMode}
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

interface HealthStatData {
  label: string;
  value: string;
  limit: string;
  ratio: number;
  tone: "primary" | "success" | "danger";
}

function HealthStat({ label, value, limit, ratio, tone }: HealthStatData) {
  const barColor =
    tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : "bg-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <p className="text-sm">
        <span className="font-semibold text-text">{value}</span>
        <span className="text-muted"> {limit}</span>
      </p>
      <div className="h-2 overflow-hidden rounded-pill bg-surface-raised">
        <div className={`h-full rounded-pill ${barColor}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function NutrientRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-semibold tabular-nums text-text">{value}</span>
    </div>
  );
}

function GroupChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-surface text-muted hover:border-primary/40"
      }`}
    >
      {label}
    </button>
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

function AddFoodForm({
  onAdd,
  goutMode,
}: {
  onAdd: (food: Omit<LoggedFood, "id">) => void;
  goutMode: boolean;
}) {
  const allFoods = useAllFoods();
  const recentFoods = useRecentFoods();
  const [mealType, setMealType] = useState<MealType>(defaultMealByHour());
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [mode, setMode] = useState<"serving" | "gram">("serving");
  const [qty, setQty] = useState(1);
  const [grams, setGrams] = useState("100");
  const [fresh, setFresh] = useState(false);
  const [creating, setCreating] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Search spans all groups; otherwise browse the picked group (or all).
    const list = q
      ? allFoods.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.nameEn.toLowerCase().includes(q),
        )
      : group
        ? allFoods.filter((f) => f.group === group)
        : allFoods;
    return q || group ? list.slice(0, 30) : list.slice(0, 8);
  }, [query, group, allFoods]);

  function pickFood(food: FoodItem) {
    setSelected(food);
    setQuery("");
    setMode("serving");
    setQty(1);
    setGrams(String(food.serving.grams));
    setFresh(false);
  }

  const gramsNum = Number.parseFloat(grams) || 0;
  const edibleGrams = selected
    ? mode === "serving"
      ? qty * selected.serving.grams
      : fresh
        ? gramsNum * (1 - selected.refusePct / 100)
        : gramsNum
    : 0;
  const preview = selected ? scaleFood(selected, edibleGrams) : null;

  function submit() {
    if (!selected || !preview || edibleGrams <= 0) return;
    onAdd({
      foodId: selected.id,
      name: selected.name,
      mealType,
      quantity: mode === "serving" ? qty : gramsNum,
      unit: mode === "serving" ? selected.serving.unit : "g",
      grams: round1(edibleGrams),
      ...preview,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Meal type */}
      <SegmentedControl
        options={MEAL_OPTIONS}
        value={mealType}
        onChange={setMealType}
        columns={4}
        ariaLabel="Bữa"
      />

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
        placeholder="Tìm món ăn (VN / EN)…"
        className="w-full rounded-btn border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary"
      />

      {/* Group browser (hidden while searching) */}
      {query.trim() === "" ? (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <GroupChip label="Tất cả" active={group === null} onClick={() => setGroup(null)} />
          {FOOD_GROUPS.map((g) => (
            <GroupChip key={g} label={g} active={group === g} onClick={() => setGroup(g)} />
          ))}
        </div>
      ) : null}

      {/* Food list */}
      <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {matches.map((f) => {
          const active = selected?.id === f.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => pickFood(f)}
                className={`flex w-full items-center justify-between gap-3 rounded-btn border px-3 py-2.5 text-left transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-text">{f.name}</span>
                    {goutMode && isHighPurine(f) ? (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-pill bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                        <AlertTriangle size={10} /> purin cao
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-[11px] text-muted">{f.nameEn}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {f.per100g.calories} kcal/100g
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

      {/* Portion + preview + submit */}
      {selected ? (
        <div className="flex flex-col gap-3 rounded-card bg-surface-raised p-3">
          {/* Portion mode */}
          <div className="grid grid-cols-2 gap-1 rounded-btn bg-surface p-1">
            {(["serving", "gram"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-[0.5rem] py-1.5 text-xs font-semibold transition-colors ${
                  mode === m ? "bg-primary text-primary-fg" : "text-muted"
                }`}
              >
                {m === "serving" ? `Theo ${selected.serving.unit}` : "Theo gram"}
              </button>
            ))}
          </div>

          {mode === "serving" ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">
                Số lượng ({selected.serving.unit})
              </span>
              <Stepper
                value={qty}
                onChange={setQty}
                step={0.5}
                min={0.5}
                ariaLabel="số lượng"
                format={fmtNum}
                valueClassName="w-10"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text">Khối lượng (g)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  aria-label="Khối lượng gram"
                  className="w-24 rounded-btn border border-border bg-surface px-3 py-2 text-center text-base font-semibold text-text outline-none focus:border-primary"
                />
              </label>
              {selected.refusePct > 0 ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs leading-snug text-muted">
                    Khối lượng tươi (cả phần bỏ {selected.refusePct}%)
                  </span>
                  <Toggle checked={fresh} onChange={setFresh} ariaLabel="Khối lượng tươi" />
                </div>
              ) : null}
            </div>
          )}

          {preview && selected ? (
            <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-text">Thành phần cho phần này</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <NutrientRow label="Calo" value={`${fmt(preview.calories)} kcal`} />
                <NutrientRow label="Đạm" value={`${fmtNum(preview.protein)} g`} />
                <NutrientRow label="Tinh bột" value={`${fmtNum(preview.carbs)} g`} />
                <NutrientRow label="Chất béo" value={`${fmtNum(preview.fat)} g`} />
                {preview.fiber != null ? (
                  <NutrientRow label="Chất xơ" value={`${fmtNum(preview.fiber)} g`} />
                ) : null}
                {preview.sodiumMg != null ? (
                  <NutrientRow label="Natri" value={`${fmt(preview.sodiumMg)} mg`} />
                ) : null}
                {preview.calciumMg != null ? (
                  <NutrientRow label="Canxi" value={`${fmt(preview.calciumMg)} mg`} />
                ) : null}
                {preview.ironMg != null ? (
                  <NutrientRow label="Sắt" value={`${fmtNum(preview.ironMg)} mg`} />
                ) : null}
                {preview.purineMg != null ? (
                  <NutrientRow label="Purin" value={`${fmt(preview.purineMg)} mg`} />
                ) : null}
              </div>
              <p className="border-t border-border pt-2 text-[11px] text-muted">
                {selected.group} · {selected.per100g.calories} kcal/100g
                {selected.refusePct > 0 ? ` · thải bỏ ${selected.refusePct}%` : ""}
              </p>
            </div>
          ) : null}

          {goutMode && selected && isHighPurine(selected) ? (
            <div className="flex items-start gap-2 rounded-btn bg-danger/10 px-3 py-2 text-danger">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="text-xs leading-snug">
                Món nhiều purin
                {preview?.purineMg != null
                  ? ` (${fmt(preview.purineMg)} mg cho phần này)`
                  : ""}
                . Cân nhắc hạn chế khi đang kiểm soát gout.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={!selected || edibleGrams <= 0}
        className="inline-flex h-12 items-center justify-center rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        Thêm vào nhật ký
      </button>
    </div>
  );
}

function EditFoodForm({
  food,
  onSave,
}: {
  food: LoggedFood;
  onSave: (patch: Partial<Omit<LoggedFood, "id" | "foodId" | "name" | "unit">>) => void;
}) {
  const [mealType, setMealType] = useState<MealType>(food.mealType);
  const [qty, setQty] = useState(food.quantity > 0 ? food.quantity : 1);

  const base = food.quantity > 0 ? food.quantity : 1;
  const ratio = qty / base;
  const opt = (v: number | null | undefined) =>
    v == null ? (v as null | undefined) : round1(v * ratio);
  const preview = {
    calories: Math.round(food.calories * ratio),
    protein: round1(food.protein * ratio),
    carbs: round1(food.carbs * ratio),
    fat: round1(food.fat * ratio),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card bg-surface-raised p-3">
        <p className="text-sm font-semibold text-text">{food.name}</p>
        <p className="text-xs text-muted">Đơn vị: {food.unit}</p>
      </div>

      <SegmentedControl
        options={MEAL_OPTIONS}
        value={mealType}
        onChange={setMealType}
        columns={4}
        ariaLabel="Bữa"
      />

      <div className="flex flex-col gap-3 rounded-card bg-surface-raised p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text">Số lượng ({food.unit})</span>
          <Stepper
            value={qty}
            onChange={setQty}
            step={0.5}
            min={0.5}
            ariaLabel="số lượng"
            format={fmtNum}
            valueClassName="w-10"
          />
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
            grams: food.grams != null ? round1(food.grams * ratio) : undefined,
            calories: preview.calories,
            protein: preview.protein,
            carbs: preview.carbs,
            fat: preview.fat,
            fiber: opt(food.fiber),
            sodiumMg: opt(food.sodiumMg),
            calciumMg: opt(food.calciumMg),
            ironMg: opt(food.ironMg),
            purineMg: opt(food.purineMg),
          })
        }
        className="inline-flex h-12 items-center justify-center rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98]"
      >
        Lưu thay đổi
      </button>
    </div>
  );
}

const CREATE_FIELDS: ReadonlyArray<{ key: "calories" | "protein" | "carbs" | "fat"; label: string }> = [
  { key: "calories", label: "Calo (kcal)" },
  { key: "protein", label: "Đạm (g)" },
  { key: "carbs", label: "Tinh bột (g)" },
  { key: "fat", label: "Béo (g)" },
];

function CreateFoodForm({
  onCreate,
  onCancel,
}: {
  onCreate: (food: Omit<FoodItem, "id" | "custom">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("phần");
  const [grams, setGrams] = useState("100");
  const [perServing, setPerServing] = useState({ calories: "", protein: "", carbs: "", fat: "" });

  const num = (v: string) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const trimmedName = name.trim();
  const servingGrams = Math.max(1, num(grams));
  const valid = trimmedName.length > 0 && num(perServing.calories) >= 0;
  const k = 100 / servingGrams; // per-serving → per 100 g

  function save() {
    if (!valid) return;
    onCreate({
      name: trimmedName,
      nameEn: trimmedName,
      group: "Tùy chỉnh",
      refusePct: 0,
      serving: { unit: unit.trim() || "phần", grams: servingGrams },
      per100g: {
        calories: round1(num(perServing.calories) * k),
        protein: round1(num(perServing.protein) * k),
        carbs: round1(num(perServing.carbs) * k),
        fat: round1(num(perServing.fat) * k),
        fiber: null,
        sodiumMg: null,
        calciumMg: null,
        ironMg: null,
        purineMg: null,
      },
    });
  }

  const inputClass =
    "w-full rounded-btn border border-border bg-surface px-3 py-2.5 text-base text-text outline-none placeholder:text-muted focus:border-primary";

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-raised p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">Món mới (cho 1 phần)</span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Hủy tạo món"
          className="inline-flex h-8 w-8 items-center justify-center rounded-btn text-muted transition hover:bg-surface hover:text-text"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
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
        {CREATE_FIELDS.map((field) => (
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
        className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        <Check size={16} /> Lưu món
      </button>
    </div>
  );
}
