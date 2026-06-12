"use client";

/**
 * Food library repository.
 *
 * The app's food library has three layers, in priority order:
 *   1. Supabase `public.foods` — the source of truth when configured. Lets the
 *      dataset grow past what ships in the bundle (toward the full FCT-2007 526).
 *   2. Dexie `libraryFoods` — an offline cache of the last successful fetch.
 *   3. The bundled {@link FOODS} array — always available, zero-latency, offline.
 *
 * `loadFoodLibrary()` returns immediately usable data (cache ∪ bundle) and, when
 * Supabase is configured and online, refreshes from remote in the background and
 * rewrites the cache. The UI never blocks on the network and always has foods.
 *
 * Logging stays local for now (see food-store); this wires only the *library*
 * read path. User-created custom foods remain in localStorage.
 */

import { FOODS, type FoodItem } from "./foods-db";
import { getDb, type CachedLibraryFood } from "@/lib/db/dexie";
import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/types/database.types";

/** True when the public Supabase env vars are present (browser-safe to read). */
export function isRemoteFoodsConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

const n = (v: number | null | undefined): number | null =>
  v == null ? null : Number(v);

/** Map a Supabase foods row to the app's FCT FoodItem. */
export function rowToFoodItem(row: Food): FoodItem {
  return {
    id: row.slug ?? row.id,
    name: row.name_vi,
    nameEn: row.name_en ?? row.name_vi,
    group: row.food_group ?? "Khác",
    refusePct: Number(row.refuse_pct ?? 0),
    serving: {
      unit: row.serving_unit ?? "phần",
      grams: Number(row.serving_grams ?? 100),
    },
    per100g: {
      calories: Number(row.calories_per_100g),
      protein: Number(row.protein_g),
      carbs: Number(row.carbs_g),
      fat: Number(row.fat_g),
      fiber: n(row.fiber_g),
      sodiumMg: n(row.sodium_mg),
      calciumMg: n(row.calcium_mg),
      ironMg: n(row.iron_mg),
      purineMg: n(row.purine_mg),
    },
  };
}

const toCached = (f: FoodItem): CachedLibraryFood => ({
  ...f,
  searchKey: `${f.name} ${f.nameEn}`.toLowerCase(),
  cachedAt: Date.now(),
});

/** De-dupe by id, keeping the first occurrence (priority order preserved). */
function dedupeById(foods: ReadonlyArray<FoodItem>): FoodItem[] {
  const seen = new Set<string>();
  const out: FoodItem[] = [];
  for (const f of foods) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
}

async function readCache(): Promise<FoodItem[]> {
  try {
    const rows = await getDb().libraryFoods.toArray();
    // Strip cache-only fields back to the plain FoodItem shape.
    return rows.map(({ searchKey: _s, cachedAt: _c, ...food }) => food);
  } catch {
    return [];
  }
}

/**
 * Fetch the full library from Supabase, map it, and replace the Dexie cache.
 * Returns the remote foods, or null if remote is unconfigured/offline/failed
 * (callers fall back to cache ∪ bundle).
 */
export async function refreshFoodLibrary(): Promise<FoodItem[] | null> {
  if (!isRemoteFoodsConfigured()) return null;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .order("food_group", { ascending: true });
    if (error || !data || data.length === 0) return null;

    const foods = (data as Food[]).map(rowToFoodItem);

    const db = getDb();
    await db.transaction("rw", db.libraryFoods, async () => {
      await db.libraryFoods.clear();
      await db.libraryFoods.bulkPut(foods.map(toCached));
    });
    return foods;
  } catch {
    return null; // never let a library refresh break the screen
  }
}

/**
 * Immediately-usable library: the Dexie cache merged over the bundled foods.
 * Remote refresh is the caller's job (see loadFoodLibrary) so this stays fast.
 */
export async function getLibrary(): Promise<FoodItem[]> {
  const cached = await readCache();
  // Cache first (it's the freshest remote snapshot), then bundle fills gaps.
  return dedupeById([...cached, ...FOODS]);
}

/**
 * Full load: returns cache ∪ bundle right away via the resolved promise, and if
 * a remote refresh succeeds, returns the remote-backed set instead. One await,
 * best-available result.
 */
export async function loadFoodLibrary(): Promise<FoodItem[]> {
  const remote = await refreshFoodLibrary();
  if (remote && remote.length > 0) return dedupeById([...remote, ...FOODS]);
  return getLibrary();
}
