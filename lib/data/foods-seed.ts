/**
 * Local Vietnamese food list for the nutrition picker (temporary, until the
 * Supabase `foods` table is connected). Macros are per ONE serving (`unit`), so
 * a logged entry is `quantity × these values`.
 */
export interface SeedFood {
  id: string;
  name: string;
  /** Serving unit shown in the picker, e.g. "tô", "dĩa", "quả". */
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const SEED_FOODS: ReadonlyArray<SeedFood> = [
  { id: "pho-bo", name: "Phở bò", unit: "tô", calories: 430, protein: 25, carbs: 55, fat: 12 },
  { id: "com-tam-suon", name: "Cơm tấm sườn", unit: "dĩa", calories: 620, protein: 30, carbs: 75, fat: 22 },
  { id: "bun-bo-hue", name: "Bún bò Huế", unit: "tô", calories: 480, protein: 28, carbs: 60, fat: 14 },
  { id: "banh-mi-thit", name: "Bánh mì thịt", unit: "ổ", calories: 400, protein: 18, carbs: 50, fat: 14 },
  { id: "com-trang", name: "Cơm trắng", unit: "chén", calories: 200, protein: 4, carbs: 44, fat: 0.4 },
  { id: "uc-ga-luoc", name: "Ức gà luộc (150g)", unit: "phần", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { id: "ca-hoi-ap-chao", name: "Cá hồi áp chảo (150g)", unit: "phần", calories: 280, protein: 34, carbs: 0, fat: 16 },
  { id: "trung-ga", name: "Trứng gà", unit: "quả", calories: 78, protein: 6, carbs: 0.6, fat: 5 },
  { id: "dau-phu", name: "Đậu phụ", unit: "miếng", calories: 88, protein: 9, carbs: 2, fat: 5 },
  { id: "khoai-lang", name: "Khoai lang luộc", unit: "củ", calories: 130, protein: 2, carbs: 30, fat: 0.2 },
  { id: "chuoi", name: "Chuối", unit: "quả", calories: 90, protein: 1, carbs: 23, fat: 0.3 },
  { id: "sua-tuoi", name: "Sữa tươi", unit: "ly", calories: 130, protein: 7, carbs: 10, fat: 7 },
  { id: "sua-chua", name: "Sữa chua", unit: "hộp", calories: 100, protein: 5, carbs: 15, fat: 3 },
  { id: "rau-luoc", name: "Rau luộc", unit: "phần", calories: 45, protein: 3, carbs: 8, fat: 0.3 },
  { id: "whey-protein", name: "Whey protein", unit: "muỗng", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
];

export function findSeedFood(id: string): SeedFood | undefined {
  return SEED_FOODS.find((f) => f.id === id);
}
