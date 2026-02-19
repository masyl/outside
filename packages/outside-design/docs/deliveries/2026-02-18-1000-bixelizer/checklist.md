# Checklist – Bixelizer

Mirrors the implementation plan phases. Add ad-hoc tasks under the relevant phase, or at the bottom under **Ad-hoc**.

---

## Phase 1 – Package scaffold

- [x] Create `packages/bixelizer/package.json`
- [x] Create `packages/bixelizer/tsconfig.json`
- [x] Install dependencies (`@napi-rs/canvas`, `opentype.js`, `pngjs`, `tsx`)
- [x] Verify pnpm workspace picks up the new package (`pnpm install`)
- [x] Create folder structure (`src/cli.ts`, `src/commands/`, `src/font/`, `src/utils/`)

## Phase 2 – CLI entry point

- [x] Implement `src/cli.ts` with `parseArgs` dispatch
- [x] Implement `src/commands/font.ts` subcommand shell (argument wiring, output folder setup)
- [x] Smoke test: `bixel font --help` exits 0 and prints usage

## Phase 3 – CP437 lookup table

- [x] Author `src/font/cp437.ts` with all 256 CP437→Unicode mappings
- [ ] Unit test: spot-check a few known mappings (0x01→U+263A, 0x41→U+0041, 0xB0→U+2591)

## Phase 4 – Glyph renderer

- [x] Implement `src/font/renderer.ts` — TTF parsing with opentype.js
- [x] Enumerate cmap code points from TTF
- [x] Implement canvas rendering at target size with `antialias = 'none'`
- [x] Implement pixel threshold (non-zero alpha → white opaque, else transparent)
- [x] Manual visual check: A, █, ☺, ─, ± — all pixel-perfect 8×8, only alpha 0 or 255

## Phase 5 – PNG writer

- [x] Implement `src/utils/png.ts` — RGBA buffer → PNG file via pngjs
- [x] Confirm output PNG is 8×8, RGBA, with correct transparency

## Phase 6 – Manifest writer

- [x] Implement `src/font/manifest.ts` — manifest shape and write/merge logic
- [ ] ~~Add `unicode-name` dependency~~ — deferred; `unicodeName` uses code point notation as fallback (e.g. "U+0041"); proper names are a follow-up
- [x] Confirm second-pass (Plus) merges sprites into existing manifest without duplicates (256 + 526 = 782 total)
- [x] Confirm `cp437Index` populated correctly for CP437 glyphs

## Phase 7 – IBM BIOS generation run

- [x] Run CP437 pass (`Px437_IBM_BIOS.ttf`) — 256 glyphs, exit 0
- [x] Run Plus pass (`PxPlus_IBM_BIOS.ttf`) — 526 additional glyphs, merges into same folder
- [x] Spot-check PNGs: A, ─ (U+2500), ☺ (U+263A), █ (U+2588), ± (U+00B1) — all correct
- [x] Inspect `manifest.json`: 782 sprites, charset flags, cp437Index values, source entries — correct
- [x] Commit generated assets to `track/bixelizer`

## Phase 8 – Storybook story

- [x] Check `.storybook/main.ts` for static asset config — updated `staticDirs` and `fs.allow`
- [x] Add `resources/` as served static path via `staticDirs: [{ from: '../../..', to: '/' }]`
- [x] Create `packages/outside-storybook/src/stories/FontSprites.stories.tsx`
- [x] Group sprites by Unicode block
- [x] Render at 4× scale (32×32 px display)
- [x] Show code point + charset as tooltip caption
- [ ] Verify story renders in `pnpm storybook` under `FONTS/IBM BIOS` — manual verification needed

## Verification

- [x] CLI smoke test: both passes exit 0
- [x] PNG spot-check: 8×8, pure white on transparent, no grey pixels
- [x] Manifest check: 782 sprites, charsets, cp437Index
- [ ] Storybook: grid visible and readable at 4× — manual verification needed
- [x] Final commit to `track/bixelizer`

---

## Ad-hoc

_Add unplanned tasks here as they arise._

- [ ] U+0000 (NULL) outputs a blank transparent PNG — acceptable, noted in renderer comment
