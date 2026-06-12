# FitVN — roadmap / deferred notes

## Food data: full FCT-2007 (526 foods) — DEFERRED

Current state: `lib/data/foods-db.ts` ships ~526 **curated approximations**;
`lib/data/fct-foods.json` holds **162 official** foods (digitized extract) that
are **merged over** the curated set (official values win on matching ids). Total
~636 foods. See `docs/FCT_IMPORT.md`.

The only public digitization found covers **162 foods**. The complete **526-food**
table exists only as the official PDF:
<https://www.fao.org/fileadmin/templates/food_composition/documents/pdf/VTN_FCT_2007.pdf>
(Bộ Y tế – Viện Dinh dưỡng, 567 pp, one food per page, 86 components).

**Future task (step 1):** convert that PDF → CSV and re-run `npm run import:fct`.
- Risk: extraction quality depends on the PDF's text layer (may be image-based).
- Plan: download FAO PDF → extract per-page tables → map to the importer's
  columns → verify a sample against known values → merge only clean rows.
- Purine is **not** an FCT-2007 component; keep curated purine for gout checks.

## Backlog (other)
- Migrate user logs (meals/workouts/measurements) to Supabase — needs a live
  project + real Supabase auth (RLS uses `auth.uid()`; app currently uses a temp
  cookie). Dexie sync-queue scaffold already exists in `lib/db/sync.ts`.
- Optional `.xlsx` reader for the importer (currently CSV only).
