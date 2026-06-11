# FitVN app icons

The source artwork is [`icon.svg`](./icon.svg) — a 512×512 master.
This folder also contains the **raster PNGs** referenced by
[`/public/manifest.json`](../manifest.json) and `app/layout.tsx`.

> ✅ **The PNGs below are committed and verified.** They are rendered from the
> brand mark by [`scripts/generate-icons.ps1`](../../scripts/generate-icons.ps1)
> (dependency-free GDI+ rasterizer). Re-run it any time the brand changes:
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
> ```
>
> For a **pixel-exact** export of `icon.svg` (full gradient on the tick, drop
> shadow), use the `sharp`/Inkscape commands below instead — the GDI+ output is
> a faithful, production-usable approximation, not a 1:1 SVG render.

## Required files

| File                        | Size      | `purpose` | Used by                              |
| --------------------------- | --------- | --------- | ------------------------------------ |
| `icon-192.png`              | 192×192   | any       | manifest, `layout.tsx` `icons.icon`  |
| `icon-256.png`              | 256×256   | any       | manifest                             |
| `icon-384.png`              | 384×384   | any       | manifest                             |
| `icon-512.png`              | 512×512   | any       | manifest (Android splash source)     |
| `icon-maskable-512.png`     | 512×512   | maskable  | manifest (Android adaptive icon)     |
| `apple-touch-icon.png`      | 180×180   | —         | `layout.tsx` `icons.apple` (iOS)     |
| `favicon.ico` *(optional)*  | 32/48     | —         | browser tab                          |

The **maskable** icon must keep the mark inside the central ~80% "safe zone"
so Android can crop it to a circle/squircle without clipping. `icon.svg` is
already full-bleed with a generous safe zone, so the same artwork exports
cleanly for both `any` and `maskable` purposes.

## One-liner: export with `sharp` (recommended, no system deps)

Run from the repo root. `sharp` ships a bundled libvips, so this works on
Windows/macOS/Linux without ImageMagick or Inkscape installed:

```bash
npx --yes sharp-cli -i public/icons/icon.svg \
  -o public/icons/icon-192.png        --resize 192 192 && \
npx --yes sharp-cli -i public/icons/icon.svg -o public/icons/icon-256.png --resize 256 256 && \
npx --yes sharp-cli -i public/icons/icon.svg -o public/icons/icon-384.png --resize 384 384 && \
npx --yes sharp-cli -i public/icons/icon.svg -o public/icons/icon-512.png --resize 512 512 && \
npx --yes sharp-cli -i public/icons/icon.svg -o public/icons/icon-maskable-512.png --resize 512 512 && \
npx --yes sharp-cli -i public/icons/icon.svg -o public/icons/apple-touch-icon.png  --resize 180 180
```

## Alternative: a tiny Node script using `sharp`

```js
// scripts/gen-icons.mjs  →  node scripts/gen-icons.mjs
import sharp from "sharp";
const src = "public/icons/icon.svg";
const sizes = [192, 256, 384, 512];
await Promise.all(
  sizes.map((s) =>
    sharp(src).resize(s, s).png().toFile(`public/icons/icon-${s}.png`)
  )
);
await sharp(src).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");
await sharp(src).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
console.log("Icons generated ✅");
```

## Alternative: ImageMagick

```bash
for s in 192 256 384 512; do \
  magick -background none public/icons/icon.svg -resize ${s}x${s} public/icons/icon-${s}.png; \
done
magick -background none public/icons/icon.svg -resize 512x512 public/icons/icon-maskable-512.png
magick -background none public/icons/icon.svg -resize 180x180 public/icons/apple-touch-icon.png
```

## Alternative: online tools

- <https://realfavicongenerator.net> — upload `icon.svg`, download the full set.
- <https://maskable.app/editor> — preview/verify the maskable safe zone.
- <https://www.pwabuilder.com/imageGenerator> — generates the full manifest icon set.

## Verifying

After generating, run a Lighthouse PWA audit (Chrome DevTools → Lighthouse) and
check **Application → Manifest** — every icon listed in `manifest.json` must
resolve with no 404 and the maskable preview should be cropped cleanly.
