import 'package:drift/drift.dart';

import '../../core/env.dart';
import '../local/database.dart';

/// Local storage for health-marker readings (acid uric, blood pressure…).
/// Enqueues a sync op when Supabase is configured (pushed to public.health_readings).
class HealthRepository {
  HealthRepository(this._db);

  final AppDatabase _db;

  Future<void> add({
    required String userId,
    required String marker, // MarkerKey.wire
    required double value,
    double? value2,
    required String measuredOn, // yyyy-mm-dd
  }) {
    return _db.addHealthReading(
      HealthReadingsCompanion.insert(
        marker: marker,
        value: value,
        value2: Value(value2),
        measuredOn: measuredOn,
        createdAt: DateTime.now().millisecondsSinceEpoch,
        userId: Value(userId),
      ),
      enqueue: Env.isSupabaseConfigured,
    );
  }

  Stream<List<HealthReading>> watch() => _db.watchHealthReadings();

  Future<void> remove(int id) => _db.deleteHealthReading(id);
}
