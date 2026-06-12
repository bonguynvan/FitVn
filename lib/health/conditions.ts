/**
 * Health conditions — opt-in profiles that re-tune the app's limits, warnings
 * and coach tone (generalizing the original gout mode). Pure config + helpers.
 */

export type ConditionKey = "gout" | "diabetes" | "hypertension" | "cholesterol";

export interface ConditionDef {
  key: ConditionKey;
  /** Vietnamese name. */
  label: string;
  /** Short description shown in the profile toggle. */
  hint: string;
  /** One-line dietary focus the coach surfaces. */
  focus: string;
}

export const CONDITIONS: Record<ConditionKey, ConditionDef> = {
  gout: {
    key: "gout",
    label: "Gout",
    hint: "Siết purin (200mg) và cảnh báo món nhiều purin",
    focus: "Hạn chế nội tạng, hải sản, thịt đỏ, bia rượu; uống nhiều nước.",
  },
  diabetes: {
    key: "diabetes",
    label: "Tiểu đường",
    hint: "Lưu ý đường và tinh bột nhanh",
    focus: "Giảm đường và tinh bột tinh chế; ưu tiên chất xơ, ăn cân đối để ổn định đường huyết.",
  },
  hypertension: {
    key: "hypertension",
    label: "Huyết áp cao",
    hint: "Siết natri xuống 1.500mg/ngày",
    focus: "Ăn nhạt (giảm muối, nước mắm, đồ chế biến sẵn); tăng rau quả giàu kali.",
  },
  cholesterol: {
    key: "cholesterol",
    label: "Mỡ máu cao",
    hint: "Lưu ý chất béo bão hòa",
    focus: "Giảm mỡ động vật, đồ chiên; tăng chất xơ hòa tan, cá và chất béo tốt.",
  },
};

export const CONDITION_ORDER: ConditionKey[] = [
  "gout",
  "diabetes",
  "hypertension",
  "cholesterol",
];

export function hasCondition(
  conditions: readonly ConditionKey[] | undefined,
  key: ConditionKey,
): boolean {
  return !!conditions && conditions.includes(key);
}

/** Sodium daily limit (mg) — tightened to 1500 when managing hypertension. */
export function sodiumLimitFor(conditions: readonly ConditionKey[] | undefined): number {
  return hasCondition(conditions, "hypertension") ? 1500 : 2000;
}

/** Active condition focus lines (for coach advice). */
export function conditionFocuses(
  conditions: readonly ConditionKey[] | undefined,
): string[] {
  return (conditions ?? []).map((k) => `${CONDITIONS[k].label}: ${CONDITIONS[k].focus}`);
}
