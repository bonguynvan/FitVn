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
  tables: [
    PendingWorkoutSessions,
    PendingLogItems,
    SyncQueue,
    CachedFoods,
    HealthReadings,
    BodyMeasurements,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  /// In-memory database for tests: `AppDatabase.forTesting(NativeDatabase.memory())`.
  AppDatabase.forTesting(QueryExecutor executor) : super(executor);

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          // v2: health-marker readings.
          if (from < 2) await m.createTable(healthReadings);
          // v3: body measurements (weight history).
          if (from < 3) await m.createTable(bodyMeasurements);
        },
      );

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

  // --- Nutrition logging ---------------------------------------------------

  /// Insert a pending log item AND enqueue its sync op atomically, so a record
  /// is never left un-queued (mirrors the web app's create-then-enqueue).
  Future<void> addPendingLog(PendingLogItemsCompanion item, int enqueuedAt) {
    return transaction(() async {
      await into(pendingLogItems).insert(item);
      await into(syncQueue).insert(SyncQueueCompanion.insert(
        entity: 'log_item',
        localId: item.localId.value,
        enqueuedAt: enqueuedAt,
      ));
    });
  }

  /// Live stream of a day's logged items (oldest first), for reactive totals.
  Stream<List<PendingLogItem>> watchLogsForDate(String date) {
    return (select(pendingLogItems)
          ..where((t) => t.loggedOn.equals(date))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .watch();
  }

  /// Remove a log item and any queued op that still references it.
  Future<void> removePendingLog(String localId) {
    return transaction(() async {
      await (delete(pendingLogItems)..where((t) => t.localId.equals(localId)))
          .go();
      await (delete(syncQueue)..where((t) => t.localId.equals(localId))).go();
    });
  }

  // --- Workout logging -----------------------------------------------------

  /// Insert a pending workout session AND enqueue its sync op atomically.
  Future<void> addPendingWorkout(
      PendingWorkoutSessionsCompanion session, int enqueuedAt) {
    return transaction(() async {
      await into(pendingWorkoutSessions).insert(session);
      await into(syncQueue).insert(SyncQueueCompanion.insert(
        entity: 'workout_session',
        localId: session.localId.value,
        enqueuedAt: enqueuedAt,
      ));
    });
  }

  Stream<List<PendingWorkoutSession>> watchWorkoutsForDate(String date) {
    return (select(pendingWorkoutSessions)
          ..where((t) => t.performedOn.equals(date))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .watch();
  }

  Future<void> removePendingWorkout(String localId) {
    return transaction(() async {
      await (delete(pendingWorkoutSessions)
            ..where((t) => t.localId.equals(localId)))
          .go();
      await (delete(syncQueue)..where((t) => t.localId.equals(localId))).go();
    });
  }

  // --- Food library cache --------------------------------------------------

  Future<int> cachedFoodsCount() async {
    final c = countAll();
    final row = await (selectOnly(cachedFoods)..addColumns([c])).getSingle();
    return row.read(c) ?? 0;
  }

  /// Upsert a batch of foods (id conflict → update), keeping the cache fresh.
  Future<void> cacheFoods(List<CachedFoodsCompanion> foods) {
    return batch((b) => b.insertAllOnConflictUpdate(cachedFoods, foods));
  }

  /// Substring search over the cached slice; Vietnamese foods first, then name.
  Future<List<CachedFood>> searchCachedFoods(String query, int limit) {
    final q = query.trim().toLowerCase();
    final sel = select(cachedFoods);
    if (q.isNotEmpty) sel.where((t) => t.searchKey.like('%$q%'));
    sel
      ..orderBy([
        (t) => OrderingTerm.desc(t.isVietnamese),
        (t) => OrderingTerm.asc(t.nameVi),
      ])
      ..limit(limit);
    return sel.get();
  }

  Stream<List<CachedFood>> watchAllCachedFoods() => select(cachedFoods).watch();

  Future<CachedFood?> cachedFood(String id) =>
      (select(cachedFoods)..where((t) => t.id.equals(id))).getSingleOrNull();

  // --- Health markers ------------------------------------------------------

  Future<void> addHealthReading(HealthReadingsCompanion reading) =>
      into(healthReadings).insert(reading);

  /// All readings, newest first (by measured date, then insert order).
  Stream<List<HealthReading>> watchHealthReadings() {
    return (select(healthReadings)
          ..orderBy([
            (t) => OrderingTerm.desc(t.measuredOn),
            (t) => OrderingTerm.desc(t.createdAt),
          ]))
        .watch();
  }

  Future<void> deleteHealthReading(int id) =>
      (delete(healthReadings)..where((t) => t.id.equals(id))).go();

  // --- Body measurements (weight history) ----------------------------------

  Future<void> addMeasurement(BodyMeasurementsCompanion m) =>
      into(bodyMeasurements).insert(m);

  /// Oldest → newest, chart-ready (reverse for a newest-first history list).
  Stream<List<BodyMeasurement>> watchMeasurements() {
    return (select(bodyMeasurements)
          ..orderBy([
            (t) => OrderingTerm.asc(t.measuredOn),
            (t) => OrderingTerm.asc(t.createdAt),
          ]))
        .watch();
  }

  Future<void> deleteMeasurement(int id) =>
      (delete(bodyMeasurements)..where((t) => t.id.equals(id))).go();

  // --- Sync status ---------------------------------------------------------

  /// Live count of records still waiting to sync — for badges / status rows.
  Stream<int> watchPendingCount() {
    final c = countAll();
    return (selectOnly(syncQueue)..addColumns([c]))
        .watchSingle()
        .map((row) => row.read(c) ?? 0);
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'fitvn.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
