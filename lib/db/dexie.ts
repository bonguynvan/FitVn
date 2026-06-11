import Dexie, { type Table } from "dexie";

import type {
  Food,
  LogItem,
  SessionExercise,
  WorkoutSession,
} from "@/types/database.types";

/**
 * FitVN offline store (IndexedDB via Dexie).
 *
 * Purpose: let the user log workouts and meals while offline, then sync to
 * Supabase when connectivity returns, and search a cached slice of the food
 * library without the network.
 *
 * Design notes:
 *   - "pending*" tables hold records created offline that still need to be
 *     pushed to Supabase. Each carries a client-generated `localId` and a
 *     `syncStatus` so the sync pass can drain them idempotently.
 *   - `syncQueue` is an append-only ledger of operations; `pushPendingToSupabase`
 *     consumes it in order. This separates "what changed" from "what to send".
 *   - `cachedFoods` mirrors a subset of public.foods for offline search.
 */

export type SyncStatus = "pending" | "syncing" | "synced" | "error";

/** A workout session created offline, mirroring workout_sessions Insert. */
export interface PendingWorkoutSession {
  /** Client-generated id (e.g. crypto.randomUUID()). Primary key. */
  localId: string;
  /** Server id once synced; null until then. */
  remoteId: string | null;
  userId: string;
  performedOn: string; // yyyy-mm-dd
  startedAt: string | null; // ISO timestamptz
  durationMin: number | null;
  notes: string | null;
  /** Per-set rows captured with the session (denormalized for offline). */
  sets: ReadonlyArray<
    Pick<
      SessionExercise,
      "exercise_id" | "set_number" | "reps" | "weight_kg" | "rpe" | "notes"
    > & { order_index?: number }
  >;
  syncStatus: SyncStatus;
  createdAt: number; // epoch ms
  updatedAt: number;
}

/** A nutrition log item created offline. Mirrors log_items + the parent date. */
export interface PendingLogItem {
  localId: string;
  remoteId: string | null;
  userId: string;
  /** The diary date (nutrition_logs.logged_on). */
  loggedOn: string; // yyyy-mm-dd
  foodId: string;
  mealType: LogItem["meal_type"];
  quantity: number;
  unit: string;
  syncStatus: SyncStatus;
  createdAt: number;
  updatedAt: number;
}

/** A locally cached food row for offline search (subset of public.foods). */
export interface CachedFood
  extends Pick<
    Food,
    | "id"
    | "name_vi"
    | "name_en"
    | "brand"
    | "serving_desc"
    | "calories_per_100g"
    | "protein_g"
    | "carbs_g"
    | "fat_g"
    | "fiber_g"
    | "is_vietnamese"
  > {
  /** Lowercased name for case-insensitive prefix search. */
  searchKey: string;
  cachedAt: number;
}

export type SyncEntity = "workout_session" | "log_item";
export type SyncOp = "create";

/** One queued operation to replay against Supabase. */
export interface SyncQueueEntry {
  /** Auto-incrementing primary key — preserves FIFO ordering. */
  id?: number;
  entity: SyncEntity;
  op: SyncOp;
  /** localId of the pending* record this entry refers to. */
  localId: string;
  /** Number of failed attempts so far (for backoff / surfacing errors). */
  attempts: number;
  lastError: string | null;
  enqueuedAt: number;
}

export class FitVnDatabase extends Dexie {
  pendingWorkoutSessions!: Table<PendingWorkoutSession, string>;
  pendingLogItems!: Table<PendingLogItem, string>;
  cachedFoods!: Table<CachedFood, string>;
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super("fitvn");

    this.version(1).stores({
      // &localId = unique primary key; remaining = secondary indexes.
      pendingWorkoutSessions:
        "&localId, userId, performedOn, syncStatus, updatedAt",
      pendingLogItems:
        "&localId, userId, loggedOn, foodId, syncStatus, updatedAt",
      // &id = food uuid; searchKey indexed for prefix queries.
      cachedFoods: "&id, searchKey, is_vietnamese, cachedAt",
      // ++id auto-increment keeps insertion (replay) order.
      syncQueue: "++id, entity, localId, enqueuedAt",
    });
  }
}

/**
 * Singleton instance. Guarded so this module is import-safe on the server
 * (Dexie needs `indexedDB`, which only exists in the browser). On the server we
 * return a typed stub that throws if any table is touched.
 */
let _db: FitVnDatabase | null = null;

export function getDb(): FitVnDatabase {
  if (typeof window === "undefined") {
    throw new Error("FitVN Dexie store is browser-only (no IndexedDB on server).");
  }
  if (!_db) {
    _db = new FitVnDatabase();
  }
  return _db;
}
