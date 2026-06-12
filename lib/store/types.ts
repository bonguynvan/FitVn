import type { MealType } from "@/types/database.types";

export type { MealType };

/** A single food entry logged into a day's diary. Macros are absolute (already
 *  scaled by quantity), so totals are a simple sum. */
export interface LoggedFood {
  id: string;
  foodId: string | null;
  name: string;
  mealType: MealType;
  quantity: number;
  unit: string;
  /** Edible grams logged (source of truth for nutrient scaling). Optional for
   *  legacy entries created before the FCT model. */
  grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Micronutrients (absolute for this entry); null = unknown, undefined = legacy. */
  fiber?: number | null;
  sodiumMg?: number | null;
  calciumMg?: number | null;
  ironMg?: number | null;
  purineMg?: number | null;
}

export interface LoggedSet {
  reps: number | null;
  weightKg: number | null;
}

export interface LoggedExercise {
  id: string;
  name: string;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  name: string;
  /** yyyy-mm-dd */
  performedOn: string;
  durationMin: number | null;
  exercises: LoggedExercise[];
  createdAt: number;
}

export interface Measurement {
  id: string;
  /** yyyy-mm-dd */
  measuredOn: string;
  weightKg: number;
  bodyFatPct: number | null;
  waistCm: number | null;
  createdAt: number;
}

export const MEAL_TYPES: ReadonlyArray<MealType> = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export const MEAL_LABEL_VI: Record<MealType, string> = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
  snack: "Bữa phụ",
};
