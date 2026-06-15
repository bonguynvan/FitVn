import 'package:fitvn_domain/fitvn_domain.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../core/date.dart';
import '../profile/profile_controller.dart';
import 'food.dart';

/// One logged entry resolved against the food catalog, with computed macros.
class LoggedEntry {
  const LoggedEntry({
    required this.localId,
    required this.food,
    required this.mealType,
    required this.quantityGrams,
  });

  final String localId;
  final Food food;
  final String mealType;
  final double quantityGrams;

  double get _factor => quantityGrams / 100.0;
  int get calories => (food.caloriesPer100g * _factor).round();
  int get proteinG => (food.proteinG * _factor).round();
  int get carbsG => (food.carbsG * _factor).round();
  int get fatG => (food.fatG * _factor).round();
}

/// Today's consumed totals vs targets.
class DayNutrition {
  const DayNutrition({required this.entries, required this.targets});

  final List<LoggedEntry> entries;
  final DailyTargets targets;

  int get calories => entries.fold(0, (s, e) => s + e.calories);
  int get proteinG => entries.fold(0, (s, e) => s + e.proteinG);
  int get carbsG => entries.fold(0, (s, e) => s + e.carbsG);
  int get fatG => entries.fold(0, (s, e) => s + e.fatG);

  int get caloriesRemaining => targets.calories - calories;
  double get calorieProgress =>
      targets.calories == 0 ? 0 : (calories / targets.calories).clamp(0.0, 1.0);
}

/// Streams today's logged items from Drift and resolves them against the
/// catalog + the user's targets. Drops items whose food id isn't in the seed
/// catalog (until the full library lands).
/// Live id → Food index of the cached library, used to resolve logged items.
final foodIndexProvider = StreamProvider<Map<String, Food>>((ref) {
  return ref.watch(foodRepositoryProvider).watchIndex();
});

final todayNutritionProvider = StreamProvider<DayNutrition>((ref) {
  final repo = ref.watch(nutritionRepositoryProvider);
  final profile = ref.watch(profileControllerProvider).valueOrNull;
  final foods = ref.watch(foodIndexProvider).valueOrNull ?? const {};
  final targets = profile == null
      ? dailyTargets
      : (profile.customTargets ?? computeTargets(profile));

  return repo.watchDay(todayIso()).map((rows) {
    final entries = <LoggedEntry>[];
    for (final r in rows) {
      final food = foods[r.foodId];
      if (food == null) continue; // not in cache yet (e.g. pre-seed)
      entries.add(LoggedEntry(
        localId: r.localId,
        food: food,
        mealType: r.mealType,
        quantityGrams: r.quantity,
      ));
    }
    return DayNutrition(entries: entries, targets: targets);
  });
});

/// Action helper for logging/removing, used by the UI.
final nutritionActionsProvider = Provider<NutritionActions>((ref) {
  return NutritionActions(
    ref.watch(nutritionRepositoryProvider),
    () => ref.read(currentUserIdProvider),
  );
});

class NutritionActions {
  NutritionActions(this._repo, this._userId);
  final NutritionRepository _repo;
  final String Function() _userId;

  Future<void> log({
    required String foodId,
    required String mealType,
    required double quantityGrams,
  }) =>
      _repo.logFood(
        userId: _userId(),
        loggedOn: todayIso(),
        foodId: foodId,
        mealType: mealType,
        quantityGrams: quantityGrams,
      );

  Future<void> remove(String localId) => _repo.remove(localId);
}
