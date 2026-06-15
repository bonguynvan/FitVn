import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../core/date.dart';
import '../../data/repositories/workout_repository.dart';
import 'exercise_catalog.dart';

/// A logged session resolved for display.
class LoggedSession {
  const LoggedSession({
    required this.localId,
    required this.exerciseNames,
    required this.setCount,
    this.durationMin,
  });

  final String localId;
  final List<String> exerciseNames;
  final int setCount;
  final int? durationMin;
}

LoggedSession _resolve(String localId, String setsJson, int? durationMin) {
  final raw = (jsonDecode(setsJson) as List).cast<Map>();
  final names = <String>[];
  for (final s in raw) {
    final id = s['exercise_id'] as String?;
    final name = id == null ? null : exerciseById(id)?.nameVi;
    if (name != null && !names.contains(name)) names.add(name);
  }
  return LoggedSession(
    localId: localId,
    exerciseNames: names,
    setCount: raw.length,
    durationMin: durationMin,
  );
}

final todayWorkoutsProvider = StreamProvider<List<LoggedSession>>((ref) {
  final repo = ref.watch(workoutRepositoryProvider);
  return repo.watchDay(todayIso()).map(
        (rows) => rows
            .map((r) => _resolve(r.localId, r.setsJson, r.durationMin))
            .toList(),
      );
});

final workoutActionsProvider = Provider<WorkoutActions>((ref) {
  return WorkoutActions(
    ref.watch(workoutRepositoryProvider),
    () => ref.read(currentUserIdProvider),
  );
});

class WorkoutActions {
  WorkoutActions(this._repo, this._userId);
  final WorkoutRepository _repo;
  final String Function() _userId;

  Future<void> logSession(List<SetEntry> sets, {int? durationMin}) {
    return _repo.logSession(
      userId: _userId(),
      performedOn: todayIso(),
      sets: sets,
      durationMin: durationMin,
    );
  }

  Future<void> remove(String localId) => _repo.remove(localId);
}
