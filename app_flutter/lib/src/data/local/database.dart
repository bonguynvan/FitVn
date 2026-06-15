import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'tables.dart';

part 'database.g.dart';

/// Local-first SQLite database (Drift). Replaces the web app's Dexie store.
///
/// NOTE: the `database.g.dart` part is generated — run
///   `dart run build_runner build --delete-conflicting-outputs`
/// after `flutter pub get`. It is intentionally gitignored.
@DriftDatabase(
  tables: [PendingWorkoutSessions, PendingLogItems, SyncQueue, CachedFoods],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  /// In-memory database for tests: `AppDatabase.forTesting(NativeDatabase.memory())`.
  AppDatabase.forTesting(QueryExecutor executor) : super(executor);

  @override
  int get schemaVersion => 1;

  // --- Sync queue (FIFO) ---------------------------------------------------

  /// Oldest-first, preserving causal order (mirrors `orderBy('id')`).
  Future<List<SyncQueueData>> queuedOperations() =>
      (select(syncQueue)..orderBy([(t) => OrderingTerm.asc(t.id)])).get();

  Future<int> pendingCount() async {
    final count = countAll();
    final row = await (selectOnly(syncQueue)..addColumns([count]))
        .getSingle();
    return row.read(count) ?? 0;
  }

  Future<void> deleteQueueEntry(int id) =>
      (delete(syncQueue)..where((t) => t.id.equals(id))).go();

  Future<void> bumpQueueAttempt(int id, int attempts, String error) =>
      (update(syncQueue)..where((t) => t.id.equals(id))).write(
        SyncQueueCompanion(attempts: Value(attempts), lastError: Value(error)),
      );

  // --- Pending records -----------------------------------------------------

  Future<PendingWorkoutSession?> pendingWorkout(String localId) =>
      (select(pendingWorkoutSessions)..where((t) => t.localId.equals(localId)))
          .getSingleOrNull();

  Future<PendingLogItem?> pendingLog(String localId) =>
      (select(pendingLogItems)..where((t) => t.localId.equals(localId)))
          .getSingleOrNull();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'fitvn.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
