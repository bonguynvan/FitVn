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
  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 4;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          // v2: health-marker readings.
          if (from < 2) await m.createTable(healthReadings);
          // v3: body measurements (weight history).
          if (from < 3) await m.createTable(bodyMeasurements);
          // v4: sync fields on health + measurement tables.
          if (from < 4) {
            await m.addColumn(healthReadings, healthReadings.userId);
            await m.addColumn(healthReadings, healthReadings.remoteId);
            await m.addColumn(healthReadings, healthReadings.syncStatus);
            await m.addColumn(bodyMeasurements, bodyMeasurements.userId);
            await m.addColumn(bodyMeasurements, bodyMeasurements.remoteId);
            await m.addColumn(bodyMeasurements, bodyMeasurements.syncStatus);
          }
        },
      );

  // --- Sync queue (FIFO) ---------------------------------------------------

  /// Oldest-first, preserving causal order (mirrors `orderBy('id')`).
  Future<List<SyncQueueData>> queuedOperations() =>
      (select(syncQueue)..orderBy([(t) => OrderingTerm.asc(t.id)])).get();

  Future<int> pendingCount() async {
    final count = countAll();
    final row = await (selectOnly(syncQueue)..addColumns([count])).getSingle();
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

  /// Insert a reading; when [enqueue], also queue a sync op (localId 'hr:<id>').
  Future<void> addHealthReading(
    HealthReadingsCompanion reading, {
    required bool enqueue,
  }) {
    return transaction(() async {
      final id = await into(healthReadings).insert(reading);
      if (enqueue) {
        await into(syncQueue).insert(SyncQueueCompanion.insert(
          entity: 'health_reading',
          localId: 'hr:$id',
          enqueuedAt: reading.createdAt.value,
        ));
      }
    });
  }

  /// All readings, newest first (by measured date, then insert order).
  Stream<List<HealthReading>> watchHealthReadings() {
    return (select(healthReadings)
          ..orderBy([
            (t) => OrderingTerm.desc(t.measuredOn),
            (t) => OrderingTerm.desc(t.createdAt),
          ]))
        .watch();
  }

  Future<HealthReading?> healthReadingById(int id) =>
      (select(healthReadings)..where((t) => t.id.equals(id))).getSingleOrNull();

  Future<void> markHealthReading(int id,
      {String? remoteId, String? syncStatus}) {
    return (update(healthReadings)..where((t) => t.id.equals(id))).write(
      HealthReadingsCompanion(
        remoteId: remoteId == null ? const Value.absent() : Value(remoteId),
        syncStatus:
            syncStatus == null ? const Value.absent() : Value(syncStatus),
      ),
    );
  }

  Future<void> deleteHealthReading(int id) {
    return transaction(() async {
      await (delete(healthReadings)..where((t) => t.id.equals(id))).go();
      await (delete(syncQueue)..where((t) => t.localId.equals('hr:$id'))).go();
    });
  }

  /// remoteIds already present locally — used to dedupe a downstream pull.
  Future<Set<String>> healthReadingRemoteIds() async {
    final rows = await (selectOnly(healthReadings)
          ..addColumns([healthReadings.remoteId])
          ..where(healthReadings.remoteId.isNotNull()))
        .get();
    return rows
        .map((r) => r.read(healthReadings.remoteId))
        .whereType<String>()
        .toSet();
  }

  // --- Body measurements (weight history) ----------------------------------

  /// Insert a measurement; when [enqueue], also queue a sync op ('bm:<id>').
  Future<void> addMeasurement(
    BodyMeasurementsCompanion m, {
    required bool enqueue,
  }) {
    return transaction(() async {
      final id = await into(bodyMeasurements).insert(m);
      if (enqueue) {
        await into(syncQueue).insert(SyncQueueCompanion.insert(
          entity: 'body_measurement',
          localId: 'bm:$id',
          enqueuedAt: m.createdAt.value,
        ));
      }
    });
  }

  /// Oldest → newest, chart-ready (reverse for a newest-first history list).
  Stream<List<BodyMeasurement>> watchMeasurements() {
    return (select(bodyMeasurements)
          ..orderBy([
            (t) => OrderingTerm.asc(t.measuredOn),
            (t) => OrderingTerm.asc(t.createdAt),
          ]))
        .watch();
  }

  Future<BodyMeasurement?> measurementById(int id) =>
      (select(bodyMeasurements)..where((t) => t.id.equals(id)))
          .getSingleOrNull();

  Future<void> markMeasurement(int id, {String? remoteId, String? syncStatus}) {
    return (update(bodyMeasurements)..where((t) => t.id.equals(id))).write(
      BodyMeasurementsCompanion(
        remoteId: remoteId == null ? const Value.absent() : Value(remoteId),
        syncStatus:
            syncStatus == null ? const Value.absent() : Value(syncStatus),
      ),
    );
  }

  Future<void> deleteMeasurement(int id) {
    return transaction(() async {
      await (delete(bodyMeasurements)..where((t) => t.id.equals(id))).go();
      await (delete(syncQueue)..where((t) => t.localId.equals('bm:$id'))).go();
    });
  }

  /// remoteIds already present locally — used to dedupe a downstream pull.
  Future<Set<String>> measurementRemoteIds() async {
    final rows = await (selectOnly(bodyMeasurements)
          ..addColumns([bodyMeasurements.remoteId])
          ..where(bodyMeasurements.remoteId.isNotNull()))
        .get();
    return rows
        .map((r) => r.read(bodyMeasurements.remoteId))
        .whereType<String>()
        .toSet();
  }

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
