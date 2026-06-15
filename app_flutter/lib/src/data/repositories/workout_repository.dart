import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';

import '../local/database.dart';

/// A single logged set, in the snake_case shape the sync service pushes to
/// Supabase `session_exercises` (so the JSON stored locally needs no remap).
class SetEntry {
  const SetEntry({
    required this.exerciseId,
    required this.setNumber,
    this.reps,
    this.weightKg,
  });

  final String exerciseId;
  final int setNumber;
  final int? reps;
  final double? weightKg;

  Map<String, dynamic> toSyncJson() => {
        'exercise_id': exerciseId,
        'set_number': setNumber,
        'reps': reps,
        'weight_kg': weightKg,
        'rpe': null,
        'notes': null,
      };
}

/// Writes offline workout sessions into the local Drift store and enqueues them
/// for sync (entity 'workout_session').
class WorkoutRepository {
  WorkoutRepository(this._db);

  final AppDatabase _db;
  static const _uuid = Uuid();

  Future<void> logSession({
    required String userId,
    required String performedOn, // yyyy-mm-dd
    required List<SetEntry> sets,
    int? durationMin,
    String? notes,
  }) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final setsJson =
        jsonEncode(sets.map((s) => s.toSyncJson()).toList());
    return _db.addPendingWorkout(
      PendingWorkoutSessionsCompanion.insert(
        localId: _uuid.v4(),
        userId: userId,
        performedOn: performedOn,
        setsJson: Value(setsJson),
        durationMin: Value(durationMin),
        notes: Value(notes),
        createdAt: now,
        updatedAt: now,
      ),
      now,
    );
  }

  Stream<List<PendingWorkoutSession>> watchDay(String performedOn) =>
      _db.watchWorkoutsForDate(performedOn);

  Future<void> remove(String localId) => _db.removePendingWorkout(localId);
}
