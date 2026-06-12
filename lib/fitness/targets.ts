import type { ActivityLevel, GoalType, SexType } from "@/types/database.types";
import { DAILY_TARGETS } from "@/lib/config/targets";

/** Personal profile used to compute daily nutrition targets. */
export interface UserProfile {
  name: string;
  goal: GoalType;
  sex: SexType;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  /** When set, overrides the auto-computed targets. */
  customTargets?: DailyTargets | null;
}

export interface DailyTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const GOAL_OPTIONS: ReadonlyArray<{
  value: GoalType;
  label: string;
  hint: string;
}> = [
  { value: "lose_fat", label: "Giảm mỡ", hint: "Ăn ít hơn mức duy trì" },
  { value: "maintain", label: "Duy trì", hint: "Giữ cân nặng hiện tại" },
  { value: "gain_muscle", label: "Tăng cơ", hint: "Ăn nhiều hơn để tăng cơ" },
];

export const SEX_OPTIONS: ReadonlyArray<{ value: SexType; label: string }> = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export const ACTIVITY_OPTIONS: ReadonlyArray<{
  value: ActivityLevel;
  label: string;
  factor: number;
}> = [
  { value: "sedentary", label: "Ít vận động", factor: 1.2 },
  { value: "light", label: "Nhẹ — 1-3 buổi/tuần", factor: 1.375 },
  { value: "moderate", label: "Vừa — 3-5 buổi/tuần", factor: 1.55 },
  { value: "active", label: "Nhiều — 6-7 buổi/tuần", factor: 1.725 },
  { value: "very_active", label: "Rất nhiều — vận động viên", factor: 1.9 },
];

const GOAL_FACTOR: Record<GoalType, number> = {
  lose_fat: 0.8,
  maintain: 1,
  gain_muscle: 1.1,
};

const PROTEIN_PER_KG: Record<GoalType, number> = {
  lose_fat: 2.0,
  maintain: 1.8,
  gain_muscle: 2.0,
};

/**
 * Mifflin-St Jeor BMR → TDEE (activity) → goal adjustment, then split macros
 * (protein by bodyweight, fat at 25% of kcal, carbs as the remainder).
 */
export function computeTargets(p: UserProfile): DailyTargets {
  const sexConstant = p.sex === "female" ? -161 : 5;
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sexConstant;
  const factor =
    ACTIVITY_OPTIONS.find((a) => a.value === p.activityLevel)?.factor ?? 1.2;
  const tdee = bmr * factor * GOAL_FACTOR[p.goal];

  const calories = Math.max(1200, Math.round(tdee / 10) * 10);
  const proteinG = Math.round(p.weightKg * PROTEIN_PER_KG[p.goal]);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(
    0,
    Math.round((calories - proteinG * 4 - fatG * 9) / 4),
  );
  return { calories, proteinG, carbsG, fatG };
}

export const DEFAULT_TARGETS: DailyTargets = DAILY_TARGETS;
