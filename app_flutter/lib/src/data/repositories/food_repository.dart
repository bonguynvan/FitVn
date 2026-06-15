import 'package:drift/drift.dart';

import '../../core/env.dart';
import '../../core/supabase.dart';
import '../../features/nutrition/food.dart';
import '../../features/nutrition/food_catalog.dart';
import '../local/database.dart';

/// Food library with three layers (web parity, priority order):
///   1. Supabase `foods` — source of truth when configured + online.
///   2. Drift `cachedFoods` — offline cache of the last successful fetch.
///   3. Bundled [seedFoods] — always available, seeds the cache on first run.
///
/// Search hits remote when possible (caching results), otherwise the cache.
class FoodRepository {
  FoodRepository(this._db);

  final AppDatabase _db;

  /// Populate the cache from the bundle the first time the app runs, so search
  /// and macro resolution work offline with zero backend.
  Future<void> ensureSeeded() async {
    if (await _db.cachedFoodsCount() > 0) return;
    await _db.cacheFoods(seedFoods.map(_toCompanion).toList());
  }

  Future<List<Food>> search(String query, {int limit = 30}) async {
    final q = query.trim();
    if (Env.isSupabaseConfigured && q.isNotEmpty) {
      try {
        final rows = await supabase
            .from('foods')
            .select()
            .or('name_vi.ilike.*$q*,name_en.ilike.*$q*')
            .limit(limit);
        final foods = (rows as List)
            .map((r) => Food.fromSupabase(r as Map<String, dynamic>))
            .toList();
        if (foods.isNotEmpty) {
          await _db.cacheFoods(foods.map(_toCompanion).toList());
          return foods;
        }
      } catch (_) {
        // fall through to the offline cache
      }
    }
    final rows = await _db.searchCachedFoods(q, limit);
    return rows.map(_fromRow).toList();
  }

  /// Live id → Food index of the cache, for resolving logged-item macros.
  Stream<Map<String, Food>> watchIndex() {
    return _db.watchAllCachedFoods().map(
          (rows) => {for (final r in rows) r.id: _fromRow(r)},
        );
  }

  Food _fromRow(CachedFood r) => Food(
        id: r.id,
        nameVi: r.nameVi,
        nameEn: r.nameEn,
        brand: r.brand,
        servingDesc: r.servingDesc,
        caloriesPer100g: r.caloriesPer100g,
        proteinG: r.proteinG,
        carbsG: r.carbsG,
        fatG: r.fatG,
        fiberG: r.fiberG,
        isVietnamese: r.isVietnamese,
      );

  CachedFoodsCompanion _toCompanion(Food f) {
    final key = '${f.nameVi} ${f.nameEn ?? ''}'.trim().toLowerCase();
    return CachedFoodsCompanion.insert(
      id: f.id,
      nameVi: f.nameVi,
      nameEn: Value(f.nameEn),
      brand: Value(f.brand),
      servingDesc: Value(f.servingDesc),
      caloriesPer100g: f.caloriesPer100g,
      proteinG: f.proteinG,
      carbsG: f.carbsG,
      fatG: f.fatG,
      fiberG: Value(f.fiberG),
      isVietnamese: Value(f.isVietnamese),
      searchKey: key,
      cachedAt: DateTime.now().millisecondsSinceEpoch,
    );
  }
}
