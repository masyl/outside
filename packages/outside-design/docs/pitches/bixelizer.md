---
Title: "Bixelizer – Asset Conversion CLI"
Category: Tooling
---

# Bixelizer – Asset Conversion CLI

## Motivation

The Outside platform needs pixel-perfect sprite assets — fonts, tiles, icons — derived from established sources such as retro PC font packs, bitmap fonts, and other asset libraries. Today this conversion work is done manually or ad hoc, with no repeatable process, no standard output format, and no metadata trail.

The **Bixelizer** is a CLI tool that sits between external asset sources and the Outside sprite pipeline. It converts raw assets (starting with TTF bitmap fonts) into the standardized PNG sprite tilesets and JSON manifests expected by the platform, in a reproducible and auditable way.

The first concrete use case is generating an ASCII/Unicode sprite tileset from the IBM BIOS font in the Oldschool PC Font Pack v2 — producing individual 8×8 px white-on-transparent PNGs and a manifest, ready to use as a font sprite sheet in the game renderer.

## Solution

A Node.js CLI package (`packages/bixelizer/`) with a `bixel` command. For the initial font pipeline, it accepts a font file (TTF) and a character set specification, then renders each glyph at its native bitmap resolution (8×8 px) into an individual PNG. Each PNG contains only white pixels on a transparent background. Output is organized into a per-font folder under `packages/sprites/fonts/`, alongside the source font file and a JSON manifest describing every generated sprite.

The tool is designed for repeatability: running it again with the same inputs produces the same outputs. All generation parameters (font file, character sets requested, render size, date) are recorded in the JSON manifest. This makes the pipeline auditable and extensible to new fonts or new asset types.

## Inclusions

- New `packages/bixelizer/` package with a `bixel` CLI entry point
- Font-to-sprite subcommand: `bixel font <path-to-ttf> [options]`
- Glyph rendering at native resolution (8×8 px for IBM BIOS), white pixels on transparent background, zero anti-aliasing
- Support for two character set inputs per run:
  - DOS/OEM-US (Code Page 437) — 256 characters, mapped to their Unicode equivalents
  - Extended Unicode ("Plus" variant) — full glyph table from the PxPlus TTF variant
- All characters from a single font in a single output folder, regardless of source character set
- Output folder named `{font-name}_{foundry-or-source}/` (e.g., `IBM_BIOS_IBM/`) under `resources/sprites/fonts/`
- File naming: `U{XXXX}.png` (uppercase Unicode code point hex, zero-padded to 4 digits minimum)
- JSON manifest (`manifest.json`) in each output folder containing:
  - Font name, foundry/source, original filename
  - Generation date and tool version
  - All generation parameters (character sets, render size, anti-aliasing settings)
  - Per-sprite entries: Unicode code point (hex), Unicode character name, filename, and which character set(s) it belongs to (CP437 index if applicable)
- Copy of the source TTF file(s) placed in the output folder for reference
- Initial generation: IBM BIOS font, both CP437 and Extended Unicode sets
- Output destination: `resources/sprites/fonts/`
- Source font files stored in `resources/temp/` and source-controlled
- Storybook story in `packages/outside-storybook/` displaying each generated font's sprite grid at 4× scale, grouped by Unicode block, one story per font

## Exclusions

- Support for non-font asset types (icons, tiles, textures) — future Bixelizer subcommands
- Aspect-corrected or scaled variants (2x, 2y) — current scope is 1:1 native pixel size only
- Runtime font rendering in the game engine — Bixelizer is a build-time/offline tool only
- Automated sprite atlas packing — individual PNGs only; atlas generation is a separate concern
- Support for `.fon`, `.otb`, or `.woff` input formats — TTF only for now
- Other fonts beyond IBM BIOS in this delivery — the pipeline is repeatable by design

## Implementation Details

The font subcommand uses **`opentype.js`** to parse the TTF and enumerate all available glyphs. Each glyph path is drawn onto a **`node-canvas`** (Cairo-backed) context at exactly 8×8 px with `imageSmoothingEnabled = false`. The resulting pixel buffer is thresholded: any pixel with non-zero alpha becomes fully opaque white; all others are fully transparent. The final pixel data is written to a PNG using **`pngjs`** (already used in `packages/resourcePacks/`).

The CP437→Unicode mapping is bundled as a static lookup table in the package. The Extended Unicode character set is derived by enumerating all cmap entries in the PxPlus TTF that are not already in the CP437 set.

## Missing Prerequisites

- `resources/sprites/fonts/` does not yet exist — needs to be created as a plain folder (not a workspace package)
- `resources/temp/` does not yet exist — source font files should be moved here and source-controlled before implementation
- `packages/bixelizer/` does not yet exist — new package to scaffold
- `node-canvas` requires Cairo native compilation; this is acceptable since the tool runs locally only, not in CI

## Suggested Follow-ups

- Additional Bixelizer subcommands: tile sheets, icon sets, texture atlases from other source formats
- Support for other retro fonts from the pack (CGA, EGA, VGA variants) using the same pipeline
- Aspect-corrected (2x height) variants for non-square pixel displays
- Sprite atlas generation: pack individual font PNGs into a single texture atlas with UV metadata
- Runtime font rendering: integrate the generated sprite sheets into the Outside renderer as a bitmap font system
- Automated Storybook visual regression tests for font sprite grids

## Credits

The initial font sprites are generated from the **Ultimate Oldschool PC Font Pack v2.2** by **VileR**.

- Website: [int10h.org/oldschool-pc-fonts](http://int10h.org/oldschool-pc-fonts/)
- License: [Creative Commons Attribution-ShareAlike 4.0 International](http://creativecommons.org/licenses/by-sa/4.0/)
- Copyright: © 2016–2020 VileR

The generated PNG sprite tilesets in `resources/sprites/fonts/` are derived works and are distributed under the same CC BY-SA 4.0 license.

## Open Questions

None — all scoping questions resolved.
