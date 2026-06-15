import 'package:drift/drift.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../local/database.dart';

/// Downstream (pull) sync: fetch the user's remote health readings + body
/// measurements and merge any not already present locally (keyed by remoteId).
///
/// Additive + idempotent: rows this device pushed already carry their remoteId
/// and are skipped; rows created on other devices are inserted as 'synced'.
/// (Deletions are not propagated yet — future work.)
class PullService {
  PullService(this._db, this._client);

  final AppDatabase _db;
  final SupabaseClient _client;

  Future<void> pull(String userId) async {
    await _pullHealth(userId);
    await _pullMeasurements(userId);
  }

  Future<void> _pullHealth(String userId) async {
    final rows =
        await _client.from('health_readings').select().eq('user_id', userId);
    final have = await _db.healthReadingRemoteIds();
    final now = DateTime.now().millisecondsSinceEpoch;

    for (final r in (rows as List).cast<Map<String, dynamic>>()) {
      final remoteId = r['id'] as String;
      if (have.contains(remoteId)) continue;
      await _db.addHealthReading(
        HealthReadingsCompanion.insert(
          marker: r['marker'] as String,
          value: (r['value'] as num).toDouble(),
          value2: Value((r['value2'] as num?)?.toDouble()),
          measuredOn: r['measured_on'] as String,
          createdAt: now,
          userId: Value(userId),
          remoteId: Value(remoteId),
          syncStatus: const Value('synced'),
        ),
        enqueue: false, // pulled rows must not be re-pushed
      );
    }
  }

  Future<void> _pullMeasurements(String userId) async {
    final rows =
        await _client.from('body_measurements').select().eq('user_id', userId);
    final have = await _db.measurementRemoteIds();
    final now = DateTime.now().millisecondsSinceEpoch;

    for (final r in (rows as List).cast<Map<String, dynamic>>()) {
      final remoteId = r['id'] as String;
      if (have.contains(remoteId)) continue;
      await _db.addMeasurement(
        BodyMeasurementsCompanion.insert(
          measuredOn: r['measured_on'] as String,
          weightKg: (r['weight_kg'] as num).toDouble(),
          bodyFatPct: Value((r['body_fat_pct'] as num?)?.toDouble()),
          waistCm: Value((r['waist_cm'] as num?)?.toDouble()),
          createdAt: now,
          userId: Value(userId),
          remoteId: Value(remoteId),
          syncStatus: const Value('synced'),
        ),
        enqueue: false,
      );
    }
  }
}
