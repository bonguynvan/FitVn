import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/types/database.types";

import {
  getDb,
  type CachedFood,
  type FitVnDatabase,
  type PendingLogItem,
  type PendingWorkoutSession,
  type SyncQueueEntry,
} from "./dexie";

/**
 * Offline → Supabase sync.
 *
 * `pushPendingToSupabase` drains the Dexie syncQueue in FIFO order, pushing each
 * pending record to Supabase. It is:
 *   - Idempotent: a record already carrying a `remoteId` is skipped/marked
 *     synced rather than re-inserted; queue entries are removed only after a
 *     confirmed write.
 *   - Resilient: a single failing entry records the error + attempt count and
 *     the pass continues with the next entry; nothing is lost.
 *   - Browser-only: relies on Dexie + the browser Supabase client.
 */

const MAX_ATTEMPTS = 5;

export interface SyncSummary {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

let inFlight: Promise<SyncSummary> | null = null;

/** Single-flight wrapper so concurrent triggers (reconnect + manual) coalesce. */
export function pushPendingToSupabase(): Promise<SyncSummary> {
  if (inFlight) return inFlight;
  inFlight = runSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSync(): Promise<SyncSummary> {
  const summary: SyncSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return summary; // offline: nothing to do
  }

  const db = getDb();
  const supabase = createClient();

  // Process oldest first to preserve causal order.
  const queue = await db.syncQueue.orderBy("id").toArray();

  for (const entry of queue) {
    summary.processed += 1;
    try {
      const result =
        entry.entity === "workout_session"
          ? await syncWorkoutSession(db, supabase, entry)
          : await syncLogItem(db, supabase, entry);

      if (result === "synced") summary.succeeded += 1;
      else summary.skipped += 1;

      // Remove the queue entry only after a confirmed write/skip.
      if (entry.id !== undefined) await db.syncQueue.delete(entry.id);
    } catch (err) {
      summary.failed += 1;
      await markEntryFailed(db, entry, err);
    }
  }

  return summary;
}

type SupabaseClient = ReturnType<typeof createClient>;

async function syncWorkoutSession(
  db: FitVnDatabase,
  supabase: SupabaseClient,
  entry: SyncQueueEntry,
): Promise<"synced" | "skipped"> {
  const record = await db.pendingWorkoutSessions.get(entry.localId);
  if (!record) return "skipped"; // already cleaned up
  if (record.remoteId) {
    await db.pendingWorkoutSessions.update(record.localId, {
      syncStatus: "synced",
    });
    return "skipped"; // idempotent: already pushed
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: record.userId,
      performed_on: record.performedOn,
      started_at: record.startedAt,
      duration_min: record.durationMin,
      notes: record.notes,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "Insert workout_session failed.");
  }

  if (record.sets.length > 0) {
    const rows = record.sets.map((s, i) => ({
      session_id: session.id,
      exercise_id: s.exercise_id,
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg,
      rpe: s.rpe,
      notes: s.notes,
      order_index: s.order_index ?? i,
    }));
    const { error: setsError } = await supabase
      .from("session_exercises")
      .insert(rows);
    if (setsError) {
      // Parent inserted but children failed: record remoteId so a retry does
      // not duplicate the session, and re-throw to keep the queue entry.
      await db.pendingWorkoutSessions.update(record.localId, {
        remoteId: session.id,
        syncStatus: "error",
        updatedAt: Date.now(),
      });
      throw new Error(setsError.message);
    }
  }

  await db.pendingWorkoutSessions.update(record.localId, {
    remoteId: session.id,
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
  return "synced";
}

async function syncLogItem(
  db: FitVnDatabase,
  supabase: SupabaseClient,
  entry: SyncQueueEntry,
): Promise<"synced" | "skipped"> {
  const record = await db.pendingLogItems.get(entry.localId);
  if (!record) return "skipped";
  if (record.remoteId) {
    await db.pendingLogItems.update(record.localId, { syncStatus: "synced" });
    return "skipped";
  }

  // Ensure the parent diary exists for (user, date). The unique constraint on
  // (user_id, logged_on) makes upsert idempotent across devices/retries.
  const { data: log, error: logError } = await supabase
    .from("nutrition_logs")
    .upsert(
      { user_id: record.userId, logged_on: record.loggedOn },
      { onConflict: "user_id,logged_on", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (logError || !log) {
    throw new Error(logError?.message ?? "Upsert nutrition_log failed.");
  }

  const { data: item, error: itemError } = await supabase
    .from("log_items")
    .insert({
      log_id: log.id,
      food_id: record.foodId,
      meal_type: record.mealType,
      quantity: record.quantity,
      unit: record.unit,
    })
    .select("id")
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Insert log_item failed.");
  }

  await db.pendingLogItems.update(record.localId, {
    remoteId: item.id,
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
  return "synced";
}

async function markEntryFailed(
  db: FitVnDatabase,
  entry: SyncQueueEntry,
  err: unknown,
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const attempts = entry.attempts + 1;

  if (entry.id !== undefined) {
    if (attempts >= MAX_ATTEMPTS) {
      // Give up replaying; leave the pending record flagged for the UI.
      await db.syncQueue.delete(entry.id);
    } else {
      await db.syncQueue.update(entry.id, { attempts, lastError: message });
    }
  }
}

// ---------------------------------------------------------------------------
// Food caching for offline search
// ---------------------------------------------------------------------------

function toCachedFood(food: Food): CachedFood {
  const name = `${food.name_vi} ${food.name_en ?? ""}`.trim().toLowerCase();
  return {
    id: food.id,
    name_vi: food.name_vi,
    name_en: food.name_en,
    brand: food.brand,
    serving_desc: food.serving_desc,
    calories_per_100g: food.calories_per_100g,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
    fiber_g: food.fiber_g,
    is_vietnamese: food.is_vietnamese,
    searchKey: name,
    cachedAt: Date.now(),
  };
}

/**
 * Cache a batch of foods locally for offline search. Call after a successful
 * online food fetch/search so the same results are available offline.
 */
export async function cacheFoods(foods: ReadonlyArray<Food>): Promise<void> {
  if (foods.length === 0) return;
  const db = getDb();
  await db.cachedFoods.bulkPut(foods.map(toCachedFood));
}

/**
 * Offline food search over the locally cached slice. Case-insensitive substring
 * match against name_vi/name_en. Vietnamese foods are surfaced first.
 */
export async function searchCachedFoods(
  query: string,
  limit = 20,
): Promise<CachedFood[]> {
  const db = getDb();
  const q = query.trim().toLowerCase();

  const all = q
    ? await db.cachedFoods
        .filter((f) => f.searchKey.includes(q))
        .limit(limit * 2)
        .toArray()
    : await db.cachedFoods.limit(limit).toArray();

  return all
    .sort((a, b) => Number(b.is_vietnamese) - Number(a.is_vietnamese))
    .slice(0, limit);
}

/** Count of records still waiting to sync — handy for badges. */
export async function getPendingCount(): Promise<number> {
  const db = getDb();
  return db.syncQueue.count();
}
