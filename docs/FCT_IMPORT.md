# Importing the official FCT-2007 data

The app ships ~526 **curated approximations** in `lib/data/foods-db.ts`. To replace
them with the official Vietnamese Food Composition Table (FCT-2007) figures, drop
in a CSV and run one command — no code changes needed.

## What file to provide

**A spreadsheet exported as CSV (UTF-8) — not a Word document.**

- In Excel/Google Sheets: *File → Save As / Download → CSV UTF-8*.
- One row per food. Decimals may use `.` or `,`. Blank cell = unknown (kept as `null`).
- Save it as **`data/fct-2007.csv`**.

A starter is in `data/fct-2007.template.csv`.

## Columns

Use these canonical headers, **or** the official Vietnamese FCT names — both are
recognized (diacritics-insensitive):

| canonical | also accepts | required |
|---|---|---|
| `name_vi` | Tên thực phẩm | ✅ |
| `kcal` | Năng lượng | ✅ |
| `name_en` | English | – |
| `group` | Nhóm | – (default "Khác") |
| `refuse_pct` | Tỷ lệ thải bỏ | – (default 0) |
| `protein_g` | Protein / Đạm | – |
| `carb_g` | Glucid / Carbohydrate | – |
| `fat_g` | Lipid / Chất béo | – |
| `fiber_g` | Chất xơ | – |
| `sodium_mg` | Natri | – |
| `calcium_mg` | Canxi | – |
| `iron_mg` | Sắt | – |
| `purine_mg` | Purin | – |
| `serving_unit` | Đơn vị | – (default "phần") |
| `serving_grams` | Khối lượng | – (default 100) |

All energy/macro/mineral values are **per 100 g of the edible portion** (the FCT
convention). `refuse_pct` is only used to convert fresh ↔ edible grams in the UI.

> **Purine note:** FCT-2007 has 86 components but purine is **not** one of them, so
> the gout checks need a separate purine source. If your CSV has no `purine_mg`
> column, purine is imported as `null` (excluded from the gout total). Provide a
> `purine_mg` column if you have gout data.

## Run

```
npm run import:fct     # data/fct-2007.csv → lib/data/fct-foods.json
npm run build          # verify it compiles
```

Once `lib/data/fct-foods.json` is non-empty, `FOODS` uses it instead of the
curated bundle automatically (same `FoodItem` shape, slug ids derived from the
Vietnamese name). Commit the generated JSON.

To push the imported library to Supabase too: `npm run seed:foods`.
