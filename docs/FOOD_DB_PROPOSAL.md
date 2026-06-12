# Proposal: Vietnamese Food Composition Table (FCT-2007) as FitVN's nutrition backbone

Source: *Bảng thành phần thực phẩm Việt Nam* — Viện Dinh dưỡng / FAO (2007).
`https://www.fao.org/fileadmin/templates/food_composition/documents/pdf/VTN_FCT_2007.pdf`

## TL;DR
Adopt the FCT-2007 as FitVN's canonical Vietnamese food database, and reposition the
product from "calorie counter" to **"kiểm tra sức khỏe & dinh dưỡng"** (health + nutrition
check). We can't hit *exact* calories — the table is precise per 100 g edible portion, but
real-world error comes from **portion estimation, cooking method, and restaurant/processed
foods**, not the database. The differentiator vs MyFitnessPal et al. is tracking
**micronutrients, sodium, purine, saturated fat** for *Vietnamese* food.

Start with a curated ~40-food MVP subset (daily staples) + a handful of key nutrients;
expand to the full 526 × 86 when we move foods to Supabase.

## Why it's valuable (and the honest caveat)
- **Asset:** 526 foods · 14 nhóm · up to 86 indices · bilingual (VN/EN) · refuse % · purine ·
  fatty acids · vitamins/minerals · bioactives. Scientifically credible, locally specific.
- **Caveat:** accuracy is bounded by the user's portion + cooking, and the table covers
  whole/fresh foods best (2007 data; packaged/restaurant items drift). Frame numbers as
  estimates ("chỉ số tham khảo"), lean on whole foods, let users correct portions.

## Data-model upgrade
- Store **per 100 g edible** + `refusePct` + `nameEn` + a nutrient set.
- **Portion math:** fresh grams (mua về) → `edible = fresh × (1 − refuse%)` → nutrient =
  `per100g × edible / 100`. (e.g. ngô tươi refuse 45 %, bò loại I refuse 2 %.)
- **Energy** (Atwater): `4·P + 9·L + 4·G` kcal; cross-check against the table.
- **Missing data:** `−` (unknown) → store as `null`, render "—", and **exclude from
  adequacy math** (never treat unknown as 0). Most important correctness rule.
- Extended nutrients: macros + fiber, sodium, calcium, iron, zinc, vit A/C/D/E, cholesterol,
  saturated fat, **purine**, (optional) carotenoid/isoflavone.

## Features (tiered)
**Tier 1 — Better core:** real VN food picker (bilingual search), refuse-aware portions,
trustworthy kcal/macros for whole foods.

**Tier 2 — Health checks (differentiator):** micronutrient adequacy vs RDA (theo tuổi/giới),
sodium + fiber totals, saturated fat + cholesterol (tim mạch), sugar (đái tháo đường).

**Tier 3 — Condition modes (premium):** Gout (purine budget + high-purine flags), Đái tháo
đường / Rối loạn lipid / Tim mạch tailored thresholds, bioactives (carotenoid/isoflavon).

## Technical approach
- **Sourcing:** prefer an already-digitized dataset (FAO INFOODS / community CSV) over
  scraping the PDF. **Attribution required.** Until then, hand-curate the staple subset.
- **Shape:** static JSON/`foods` table; `null` for `−`.
- **Storage:** ~40 foods × ~10 nutrients bundles locally (offline-first). Full 526 × 86 →
  Supabase `foods` table (already in the deferred schema) + Dexie cache. This naturally
  motivates the Supabase step.

## Phased rollout (maps to our architecture)
1. **Now (local):** richer food model (per-100 g + refuse + nameEn + ~9 nutrients),
   ~40 curated staples, fresh↔edible gram portions, fiber + sodium on the daily summary.
2. **Supabase phase:** full dataset in `foods`, bilingual search at scale, micronutrient
   adequacy + condition modes.

## First step (in progress)
1. New `FoodItem` model (per-100 g edible + `refusePct` + `nameEn` + cal/P/C/F + fiber,
   sodium, calcium, iron, purine).
2. Curate ~40 staple VN foods (approx values, flagged for replacement with exact FCT data).
3. Portion mode in the add sheet: serving **or** grams with a fresh↔edible (refuse) toggle.
4. Add fiber + sodium "health check" lines to the daily summary.

> Note: the curated values in `lib/data/foods-db.ts` are approximations to validate the
> model end-to-end; replace with exact FCT-2007 figures (or a digitized dataset) before any
> clinical/condition features ship.
