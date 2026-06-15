import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../local/database.dart';
import 'sync_models.dart';

/// Offline → Supabase sync. Faithful port of `lib/db/sync.ts`.
///
///   - Idempotent: a pending record already carrying a `remoteId` is marked
///     synced rather than re-inserted; queue entries are removed only after a
///     confirmed write.
///   - Resilient: a single failing entry records the error + attempt count and
///     the pass continues; nothing is lost. After [kMaxSyncAttempts] the queue
///     entry is dropped and the pending row stays flagged for the UI.
///   - Single-flight: concurrent triggers (reconnect + manual) coalesce.
class SyncService {
  SyncService(this._db, this._client);

  final AppDatabase _db;
  final SupabaseClient _client;

  Future<SyncSummary>? _inFlight;

  Future<SyncSummary> pushPending() {
    return _inFlight ??= _run().whenComplete(() => _inFlight = null);
  }

  Future<SyncSummary> _run() async {
    final summary = SyncSummary();
    final queue = await _db.queuedOperations(); // oldest first

    for (final entry in queue) {
      summary.processed += 1;
      try {
        final outcome = switch (entry.entity) {
          'workout_session' => await _syncWorkoutSession(entry),
          'log_item' => await _syncLogItem(entry),
          'health_reading' => await _syncHealthReading(entry),
          'body_measurement' => await _syncMeasurement(entry),
          _ => SyncOutcome.skipped,
        };

        if (outcome == SyncOutcome.synced) {
          summary.succeeded += 1;
        } else {
          summary.skipped += 1;
        }
        // Remove only after a confirmed write/skip.
        await _db.deleteQueueEntry(entry.id);
      } catch (err) {
        summary.failed += 1;
        await _markFailed(entry, err);
      }
    }
    return summary;
  }

  Future<SyncOutcome> _syncWorkoutSession(SyncQueueData entry) async {
    final record = await _db.pendingWorkout(entry.localId);
    if (record == null) return SyncOutcome.skipped; // already cleaned up
    if (record.remoteId != null) {
      await _setWorkoutStatus(record.localId, 'synced');
      return SyncOutcome.skipped; // idempotent: already pushed
    }

    final session = await _client
        .from('workout_sessions')
        .insert({
          'user_id': record.userId,
          'performed_on': record.performedOn,
          'started_at': record.startedAt,
          'duration_min': record.durationMin,
          'notes': record.notes,
        })
        .select('id')
        .single();
    final sessionId = session['id'] as String;

    final sets = (jsonDecode(record.setsJson) as List).cast<Map>();
    if (sets.isNotEmpty) {
      final rows = <Map<String, dynamic>>[];
      for (var i = 0; i < sets.length; i++) {
        final s = sets[i].cast<String, dynamic>();
        rows.add({
          'session_id': sessionId,
          'exercise_id': s['exercise_id'],
          'set_number': s['set_number'],
          'reps': s['reps'],
          'weight_kg': s['weight_kg'],
          'rpe': s['rpe'],
          'notes': s['notes'],
          'order_index': s['order_index'] ?? i,
        });
      }
      try {
        await _client.from('session_exercises').insert(rows);
      } catch (e) {
        // Parent inserted but children failed: persist remoteId so a retry does
        // not duplicate the session, then re-throw to keep the queue entry.
        await (_db.update(_db.pendingWorkoutSessions)
              ..where((t) => t.localId.equals(record.localId)))
            .write(PendingWorkoutSessionsCompanion(
          remoteId: Value(sessionId),
          syncStatus: const Value('error'),
          updatedAt: Value(_now()),
        ));
        rethrow;
      }
    }

    await (_db.update(_db.pendingWorkoutSessions)
          ..where((t) => t.localId.equals(record.localId)))
        .write(PendingWorkoutSessionsCompanion(
      remoteId: Value(sessionId),
      syncStatus: const Value('synced'),
      updatedAt: Value(_now()),
    ));
    return SyncOutcome.synced;
  }

  Future<SyncOutcome> _syncLogItem(SyncQueueData entry) async {
    final record = await _db.pendingLog(entry.localId);
    if (record == null) return SyncOutcome.skipped;
    if (record.remoteId != null) {
      await _setLogStatus(record.localId, 'synced');
      return SyncOutcome.skipped;
    }

    // Parent diary upsert is idempotent via the (user_id, logged_on) unique key.
    final log = await _client
        .from('nutrition_logs')
        .upsert(
          {'user_id': record.userId, 'logged_on': record.loggedOn},
          onConflict: 'user_id,logged_on',
        )
        .select('id')
        .single();

    final item = await _client
        .from('log_items')
        .insert({
          'log_id': log['id'],
          'food_id': record.foodId,
          'meal_type': record.mealType,
          'quantity': record.quantity,
          'unit': record.unit,
        })
        .select('id')
        .single();

    await (_db.update(_db.pendingLogItems)
          ..where((t) => t.localId.equals(record.localId)))
        .write(PendingLogItemsCompanion(
      remoteId: Value(item['id'] as String),
      syncStatus: const Value('synced'),
      updatedAt: Value(_now()),
    ));
    return SyncOutcome.synced;
  }

  Future<SyncOutcome> _syncHealthReading(SyncQueueData entry) async {
    final id = int.tryParse(entry.localId.replaceFirst('hr:', ''));
    if (id == null) return SyncOutcome.skipped;
    final record = await _db.healthReadingById(id);
    if (record == null) return SyncOutcome.skipped;
    if (record.remoteId != null) {
      await _db.markHealthReading(id, syncStatus: 'synced');
      return SyncOutcome.skipped;
    }

    final row = await _client
        .from('health_readings')
        .insert({
          'user_id': record.userId,
          'marker': record.marker,
          'value': record.value,
          'value2': record.value2,
          'measured_on': record.measuredOn,
        })
        .select('id')
        .single();

    await _db.markHealthReading(id,
        remoteId: row['id'] as String, syncStatus: 'synced');
    return SyncOutcome.synced;
  }

  Future<SyncOutcome> _syncMeasurement(SyncQueueData entry) async {
    final id = int.tryParse(entry.localId.replaceFirst('bm:', ''));
    if (id == null) return SyncOutcome.skipped;
    final record = await _db.measurementById(id);
    if (record == null) return SyncOutcome.skipped;
    if (record.remoteId != null) {
      await _db.markMeasurement(id, syncStatus: 'synced');
      return SyncOutcome.skipped;
    }

    final row = await _client
        .from('body_measurements')
        .insert({
          'user_id': record.userId,
          'measured_on': record.measuredOn,
          'weight_kg': record.weightKg,
          'body_fat_pct': record.bodyFatPct,
          'waist_cm': record.waistCm,
        })
        .select('id')
        .single();

    await _db.markMeasurement(id,
        remoteId: row['id'] as String, syncStatus: 'synced');
    return SyncOutcome.synced;
  }

  Future<void> _markFailed(SyncQueueData entry, Object err) async {
    final attempts = entry.attempts + 1;
    if (attempts >= kMaxSyncAttempts) {
      await _db
          .deleteQueueEntry(entry.id); // give up; pending row stays flagged
    } else {
      await _db.bumpQueueAttempt(entry.id, attempts, err.toString());
    }
  }

  Future<void> _setWorkoutStatus(String localId, String status) =>
      (_db.update(_db.pendingWorkoutSessions)
            ..where((t) => t.localId.equals(localId)))
          .write(PendingWorkoutSessionsCompanion(syncStatus: Value(status)));

  Future<void> _setLogStatus(String localId, String status) =>
      (_db.update(_db.pendingLogItems)..where((t) => t.localId.equals(localId)))
          .write(PendingLogItemsCompanion(syncStatus: Value(status)));

  int _now() => DateTime.now().millisecondsSinceEpoch;
}
