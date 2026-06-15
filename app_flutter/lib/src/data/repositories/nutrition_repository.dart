import 'package:uuid/uuid.dart';

import '../local/database.dart';

/// Writes/reads offline nutrition log items in the local Drift store. Each new
/// item is enqueued for sync (see SyncService), mirroring the web app's
/// create-then-enqueue flow. Quantities are grams; macros are derived at read
/// time by joining the food catalog (see NutritionController).
class NutritionRepository {
  NutritionRepository(this._db);

  final AppDatabase _db;
  static const _uuid = Uuid();

  Future<void> logFood({
    required String userId,
    required String loggedOn, // yyyy-mm-dd
    required String foodId,
    required String mealType, // breakfast | lunch | dinner | snack
    required double quantityGrams,
  }) {
    final now = DateTime.now().millisecondsSinceEpoch;
    return _db.addPendingLog(
      PendingLogItemsCompanion.insert(
        localId: _uuid.v4(),
        userId: userId,
        loggedOn: loggedOn,
        foodId: foodId,
        mealType: mealType,
        quantity: quantityGrams,
        unit: 'g',
        createdAt: now,
        updatedAt: now,
      ),
      now,
    );
  }

  Stream<List<PendingLogItem>> watchDay(String loggedOn) =>
      _db.watchLogsForDate(loggedOn);

  Future<void> remove(String localId) => _db.removePendingLog(localId);
}
