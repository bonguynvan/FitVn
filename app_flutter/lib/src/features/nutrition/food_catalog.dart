import 'food.dart';

/// Bundled seed foods — always available, zero-latency, offline. They seed the
/// Drift `cachedFoods` table on first run; when Supabase is configured, search
/// augments the cache with the full library (web parity: cache ∪ bundle).
const List<Food> seedFoods = [
  Food(id: 'rice_white', nameVi: 'Cơm trắng', caloriesPer100g: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, servingDesc: '1 bát ~ 150g'),
  Food(id: 'pho_bo', nameVi: 'Phở bò', caloriesPer100g: 70, proteinG: 5, carbsG: 9, fatG: 1.5, servingDesc: '1 tô ~ 500g'),
  Food(id: 'chicken_breast', nameVi: 'Ức gà luộc', caloriesPer100g: 165, proteinG: 31, carbsG: 0, fatG: 3.6),
  Food(id: 'egg', nameVi: 'Trứng gà', caloriesPer100g: 155, proteinG: 13, carbsG: 1.1, fatG: 11, servingDesc: '1 quả ~ 50g'),
  Food(id: 'banh_mi', nameVi: 'Bánh mì thịt', caloriesPer100g: 250, proteinG: 9, carbsG: 35, fatG: 8, servingDesc: '1 ổ ~ 180g'),
  Food(id: 'tofu', nameVi: 'Đậu phụ', caloriesPer100g: 76, proteinG: 8, carbsG: 1.9, fatG: 4.8),
  Food(id: 'pork_lean', nameVi: 'Thịt heo nạc', caloriesPer100g: 143, proteinG: 21, carbsG: 0, fatG: 6),
  Food(id: 'beef', nameVi: 'Thịt bò', caloriesPer100g: 250, proteinG: 26, carbsG: 0, fatG: 15),
  Food(id: 'rau_muong', nameVi: 'Rau muống luộc', caloriesPer100g: 23, proteinG: 2.6, carbsG: 3.1, fatG: 0.2),
  Food(id: 'banana', nameVi: 'Chuối', caloriesPer100g: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, servingDesc: '1 quả ~ 120g'),
  Food(id: 'milk', nameVi: 'Sữa tươi', caloriesPer100g: 60, proteinG: 3.2, carbsG: 4.8, fatG: 3.2, servingDesc: '1 ly ~ 200ml'),
  Food(id: 'fish', nameVi: 'Cá nục', caloriesPer100g: 111, proteinG: 22, carbsG: 0, fatG: 2.5),
];
