import 'package:drift/drift.dart';

/// Drift table definitions — the local-first store, ported 1:1 from the web
/// app's Dexie schema (`lib/db/dexie.ts`).
///
/// Design (unchanged from web):
///   - `pending*` tables hold records created offline awaiting a push to
///     Supabase. Each carries a client `localId` + `syncStatus`.
///   - `syncQueue` is an append-only FIFO ledger consumed by the sync service.
///   - `cachedFoods` / `libraryFoods` mirror food data for offline search.

/// A workout session created offline (mirrors workout_sessions Insert).
class PendingWorkoutSessions extends Table {
  TextColumn get localId => text()();
  TextColumn get remoteId => text().nullable()();
  TextColumn get userId => text()();
  TextColumn get performedOn => text()(); // yyyy-mm-dd
  TextColumn get startedAt => text().nullable()(); // ISO timestamptz
  IntColumn get durationMin => integer().nullable()();
  TextColumn get notes => text().nullable()();

  /// Per-set rows captured with the session, stored as a JSON array.
  TextColumn get setsJson => text().withDefault(const Constant('[]'))();

  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  IntColumn get createdAt => integer()(); // epoch ms
  IntColumn get updatedAt => integer()();

  @override
  Set<Column> get primaryKey => {localId};
}

/// A nutrition log item created offline (mirrors log_items + parent date).
class PendingLogItems extends Table {
  TextColumn get localId => text()();
  TextColumn get remoteId => text().nullable()();
  TextColumn get userId => text()();
  TextColumn get loggedOn => text()(); // yyyy-mm-dd
  TextColumn get foodId => text()();
  TextColumn get mealType => text()();
  RealColumn get quantity => real()();
  TextColumn get unit => text()();
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  IntColumn get createdAt => integer()();
  IntColumn get updatedAt => integer()();

  @override
  Set<Column> get primaryKey => {localId};
}

/// One queued operation to replay against Supabase (FIFO by autoincrement id).
class SyncQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entity => text()(); // 'workout_session' | 'log_item'
  TextColumn get op => text().withDefault(const Constant('create'))();
  TextColumn get localId => text()();
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
  IntColumn get enqueuedAt => integer()();
}

/// A health-marker reading (acid uric, blood pressure, glucose, lipids…).
/// Local-only for now — the web app keeps these in localStorage; there is no
/// Supabase table yet, so they are not enqueued for sync.
class HealthReadings extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get marker => text()(); // MarkerKey.wire
  RealColumn get value => real()();
  RealColumn get value2 => real().nullable()(); // e.g. diastolic
  TextColumn get measuredOn => text()(); // yyyy-mm-dd
  IntColumn get createdAt => integer()();
}

/// A locally cached food row for offline search (subset of public.foods).
class CachedFoods extends Table {
  TextColumn get id => text()();
  TextColumn get nameVi => text()();
  TextColumn get nameEn => text().nullable()();
  TextColumn get brand => text().nullable()();
  TextColumn get servingDesc => text().nullable()();
  RealColumn get caloriesPer100g => real()();
  RealColumn get proteinG => real()();
  RealColumn get carbsG => real()();
  RealColumn get fatG => real()();
  RealColumn get fiberG => real().nullable()();
  BoolColumn get isVietnamese => boolean().withDefault(const Constant(false))();

  /// Lowercased name for case-insensitive substring search.
  TextColumn get searchKey => text()();
  IntColumn get cachedAt => integer()();

  @override
  Set<Column> get primaryKey => {id};
}
