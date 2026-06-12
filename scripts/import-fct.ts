/**
 * Import the official Vietnamese Food Composition Table (FCT-2007) from a CSV
 * export into the app.
 *
 * Reads   data/fct-2007.csv   (UTF-8; export from Excel as "CSV UTF-8")
 * Writes  lib/data/fct-foods.json   (FoodItem[]; consumed by lib/data/foods-db.ts)
 *
 * When that JSON is non-empty the app uses it INSTEAD of the curated bundle.
 * Run:  npm run import:fct
 *
 * Columns are matched by canonical name OR common Vietnamese FCT headers
 * (diacritics-insensitive). See docs/FCT_IMPORT.md.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const IN = resolve(process.cwd(), "data/fct-2007.csv");
const OUT = resolve(process.cwd(), "lib/data/fct-foods.json");

/** Strip Vietnamese diacritics → ascii (for slugs + header matching). */
function deaccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function slugify(name: string): string {
  return (
    deaccent(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mon"
  );
}

/** Minimal RFC-4180-ish CSV parser (handles quotes, commas, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // ignore (handled by \n)
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Canonical column → accepted header aliases (ascii, lowercased, unit-stripped). */
const ALIASES: Record<string, string[]> = {
  name_vi: ["name_vi", "ten thuc pham", "ten thuc an", "ten mon", "ten", "food name", "ten tieng viet"],
  name_en: ["name_en", "english", "ten tieng anh", "english name"],
  group: ["group", "nhom", "food group", "nhom thuc pham", "loai"],
  refuse_pct: ["refuse_pct", "ty le thai bo", "refuse", "thai bo"],
  kcal: ["kcal", "nang luong", "energy", "calories", "calo", "calories kcal"],
  protein_g: ["protein_g", "protein", "dam", "chat dam"],
  carb_g: ["carb_g", "glucid", "carbohydrate", "carbohydrates", "carbonhydrates", "carb", "carbs", "tinh bot"],
  fat_g: ["fat_g", "lipid", "fat", "chat beo", "beo"],
  fiber_g: ["fiber_g", "chat xo", "fiber", "xo", "celluloza", "cellulose"],
  sodium_mg: ["sodium_mg", "natri", "sodium", "na"],
  calcium_mg: ["calcium_mg", "canxi", "calcium", "ca"],
  iron_mg: ["iron_mg", "sat", "iron", "fe"],
  purine_mg: ["purine_mg", "purin", "purine"],
  serving_unit: ["serving_unit", "don vi", "unit"],
  serving_grams: ["serving_grams", "gram", "grams", "khoi luong", "serving_g"],
};

/** Normalize a header cell: deaccent, drop "(unit)" suffixes, collapse spaces. */
function normHeader(h: string): string {
  return deaccent(h)
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildHeaderIndex(header: string[]): Record<string, number> {
  const norm = header.map(normHeader);
  const idx: Record<string, number> = {};
  for (const [canon, aliases] of Object.entries(ALIASES)) {
    const found = norm.findIndex((h) => aliases.includes(h));
    if (found !== -1) idx[canon] = found;
  }
  return idx;
}

/** Map a raw FCT group label to one of the app's 14 FOOD_GROUPS. */
function normalizeGroup(raw: string): string {
  const g = deaccent(raw).toLowerCase();
  if (g.includes("ngu coc")) return "Ngũ cốc";
  if (g.includes("khoai")) return "Khoai củ";
  if (g.includes("dau") && g.includes("mo")) return "Dầu mỡ";
  if (g.includes("hat")) return "Đậu & hạt";
  if (g.includes("rau")) return "Rau";
  if (g.includes("qua chin") || g.includes("trai cay")) return "Trái cây";
  if (g.includes("thit")) return "Thịt";
  if (g.includes("thuy san")) return "Thủy sản";
  if (g.includes("trung")) return "Trứng";
  if (g.includes("sua")) return "Sữa";
  if (g.includes("do hop")) return "Món ăn";
  if (g.includes("ngot") || g.includes("duong") || g.includes("banh") || g.includes("keo"))
    return "Đường & bánh kẹo";
  if (g.includes("gia vi") || g.includes("nuoc cham")) return "Gia vị";
  if (g.includes("nuoc giai khat") || g.includes("nuoc uong")) return "Đồ uống";
  return raw.trim() || "Khác";
}

const numOrNull = (raw: string | undefined): number | null => {
  if (raw == null) return null;
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "" || t === "-") return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
};
const numOr = (raw: string | undefined, fallback: number): number =>
  numOrNull(raw) ?? fallback;

function main(): void {
  let text: string;
  try {
    text = readFileSync(IN, "utf8");
  } catch {
    console.error(`No file at ${IN}. Create it from data/fct-2007.template.csv (export Excel as CSV UTF-8).`);
    process.exit(1);
  }

  const rows = parseCsv(text);
  if (rows.length < 2) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  const idx = buildHeaderIndex(rows[0]);
  if (idx.name_vi == null || idx.kcal == null) {
    console.error(
      "Missing required columns. Need at least a name column (name_vi / 'Tên thực phẩm') and energy (kcal / 'Năng lượng').",
    );
    console.error("Detected columns:", Object.keys(idx).join(", ") || "(none)");
    process.exit(1);
  }

  const get = (row: string[], key: string) =>
    idx[key] != null ? row[idx[key]] : undefined;

  const seen = new Set<string>();
  const foods: unknown[] = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const nameVi = (get(row, "name_vi") ?? "").trim();
    const kcal = numOrNull(get(row, "kcal"));
    if (!nameVi || kcal == null) {
      skipped += 1;
      continue;
    }

    let id = slugify(nameVi);
    let n = 2;
    while (seen.has(id)) id = `${slugify(nameVi)}-${n++}`;
    seen.add(id);

    const nameEn = (get(row, "name_en") ?? "").trim() || nameVi;
    foods.push({
      id,
      name: nameVi,
      nameEn,
      group: normalizeGroup(get(row, "group") ?? ""),
      refusePct: numOr(get(row, "refuse_pct"), 0),
      serving: {
        unit: (get(row, "serving_unit") ?? "").trim() || "phần",
        grams: numOr(get(row, "serving_grams"), 100),
      },
      per100g: {
        calories: Math.round(kcal),
        protein: numOr(get(row, "protein_g"), 0),
        carbs: numOr(get(row, "carb_g"), 0),
        fat: numOr(get(row, "fat_g"), 0),
        fiber: numOrNull(get(row, "fiber_g")),
        sodiumMg: numOrNull(get(row, "sodium_mg")),
        calciumMg: numOrNull(get(row, "calcium_mg")),
        ironMg: numOrNull(get(row, "iron_mg")),
        purineMg: numOrNull(get(row, "purine_mg")),
      },
    });
  }

  writeFileSync(OUT, JSON.stringify(foods, null, 2) + "\n", "utf8");

  const groups = new Set(foods.map((f) => (f as { group: string }).group));
  console.log(`Imported ${foods.length} foods → lib/data/fct-foods.json`);
  console.log(`Groups: ${groups.size} | Skipped rows (no name/energy): ${skipped}`);
  console.log("Run `npm run build` to verify, then commit fct-foods.json.");
}

main();
