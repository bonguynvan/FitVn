/**
 * Seed / sync the FCT food library into Supabase `public.foods`.
 *
 * Source of truth is the bundled {@link FOODS} array (lib/data/foods-db.ts), so
 * this never drifts from the app. Rows are upserted on `slug`, making re-runs
 * idempotent — run it again after expanding the dataset toward the full 526.
 *
 * Usage:
 *   1. Apply migrations 0001 + 0002 to your Supabase project.
 *   2. Put NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *   3. npm run seed:foods
 *
 * The service-role key bypasses RLS (writes to the shared library); keep it
 * server-side only and never commit it.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { FOODS } from "@/lib/data/foods-db";
import type { FoodInsert } from "@/types/database.types";

/** Minimal .env.local loader (no dotenv dependency). */
function loadEnvLocal(): void {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* no .env.local — rely on the ambient environment */
  }
}

function toInsert(): FoodInsert[] {
  return FOODS.map((f) => ({
    slug: f.id,
    name_vi: f.name,
    name_en: f.nameEn,
    food_group: f.group,
    refuse_pct: f.refusePct,
    serving_unit: f.serving.unit,
    serving_grams: f.serving.grams,
    calories_per_100g: f.per100g.calories,
    protein_g: f.per100g.protein,
    carbs_g: f.per100g.carbs,
    fat_g: f.per100g.fat,
    fiber_g: f.per100g.fiber,
    sodium_mg: f.per100g.sodiumMg,
    calcium_mg: f.per100g.calciumMg,
    iron_mg: f.per100g.ironMg,
    purine_mg: f.per100g.purineMg,
    is_vietnamese: true,
    is_verified: true,
  }));
}

async function main(): Promise<void> {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing env: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const rows = toInsert();
  console.log(`Seeding ${rows.length} foods → public.foods …`);

  const { error } = await supabase
    .from("foods")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: false });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Done. ${rows.length} foods upserted (idempotent on slug).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
