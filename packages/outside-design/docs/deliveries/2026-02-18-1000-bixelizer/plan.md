# Implementation Plan – Bixelizer

## Context

The Bixelizer is a new CLI package (`packages/bixelizer/`) that converts external assets into sprite tilesets for the Outside platform. This first delivery targets TTF bitmap fonts from the Oldschool PC Font Pack v2, generating individual 8×8 px white-on-transparent PNGs plus a JSON manifest per font. The output lands in `resources/sprites/fonts/`, and a Storybook story renders the results at 4× scale.

The font pack is already source-controlled at `resources/temp/oldschool_pc_font_pack_v2/`.

---

## Phase 1 – Package scaffold

Create the `packages/bixelizer/` workspace package. It follows the same conventions as `packages/resourcePacks/` (ES modules, TypeScript, Vitest) but is a CLI tool with a bin entry, not a library.

### 1.1 – `package.json`

**Path**: `packages/bixelizer/package.json`

```json
{
  "name": "@outside/bixelizer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "bixel": "./src/cli.ts"
  },
  "scripts": {
    "font:ibm-bios": "node --import tsx/esm src/cli.ts font ...",
    "build": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "echo \"No linter configured yet\"",
    "clean": "rm -rf dist node_modules"
  },
  "devDependencies": {
    "@napi-rs/canvas": "^0.1.68",
    "opentype.js": "^1.3.4",
    "pngjs": "^7.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.3",
    "vitest": "^4.0.18"
  }
}
```

Notes:
- Uses `tsx` for running TypeScript source directly (no build step needed for local CLI use)
- `@napi-rs/canvas` instead of `node-canvas` — pre-built binaries, no Cairo compilation required, same API
- `opentype.js` for TTF parsing and glyph enumeration
- `pngjs` for PNG writing

### 1.2 – `tsconfig.json`

**Path**: `packages/bixelizer/tsconfig.json`

Follows the `resourcePacks` pattern: `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"strict": true`, `"target": "ES2022"`, `"noEmit": true` (tool runs directly from source with tsx).

### 1.3 – Folder structure

```
packages/bixelizer/
├── package.json
├── tsconfig.json
└── src/
    ├── cli.ts                  # Entry point — parseArgs, dispatch to subcommands
    ├── commands/
    │   └── font.ts             # bixel font subcommand logic
    ├── font/
    │   ├── renderer.ts         # Glyph rendering (canvas + opentype.js)
    │   ├── cp437.ts            # CP437 index → Unicode code point lookup table
    │   └── manifest.ts         # manifest.json shape and writer
    └── utils/
        └── png.ts              # PNG buffer → file via pngjs
```

---

## Phase 2 – CLI entry point

**File**: `src/cli.ts`

Uses `node:util` `parseArgs` (Node 18+ built-in) — no third-party CLI library needed.

```
bixel font <ttf-path>
  --name <font-name>       e.g. IBM_BIOS
  --foundry <foundry>      e.g. IBM
  --charset <cp437|plus>   which character set this TTF represents
  --output <dir>           output root (default: resources/sprites/fonts)
  --size <n>               glyph size in px (default: 8)
```

The subcommand resolves the output folder as `{output}/{name}_{foundry}/`, runs the font converter, writes PNGs and manifest.

Running the IBM BIOS generation is done in two passes:
1. `bixel font Px437_IBM_BIOS.ttf --name IBM_BIOS --foundry IBM --charset cp437`
2. `bixel font PxPlus_IBM_BIOS.ttf --name IBM_BIOS --foundry IBM --charset plus`

Both passes write into the same output folder. The second pass appends to the manifest.

---

## Phase 3 – CP437 lookup table

**File**: `src/font/cp437.ts`

A static array of 256 Unicode code points, indexed by CP437 byte value (0–255). Based on the standard CP437→Unicode mapping published by the Unicode Consortium.

Positions 0x00–0x1F and 0x7F map to their Unicode control-picture equivalents (U+2400–U+241F) for rendering — or to a visible glyph if the font provides one at that code point.

Exported as:
```ts
export const CP437_TO_UNICODE: number[] = [ /* 256 entries */ ];
```

---

## Phase 4 – Glyph renderer

**File**: `src/font/renderer.ts`

### 4.1 – Enumerate glyphs from a TTF

Use `opentype.js` to parse the TTF and extract the cmap table. This gives all Unicode code points the font supports.

```ts
import opentype from 'opentype.js';
const font = opentype.loadSync(ttfPath);
const codePoints: number[] = Object.keys(font.tables.cmap.glyphIndexMap).map(Number);
```

For the CP437 pass, intersect the cmap entries with the CP437 lookup table. For the Plus pass, take all cmap entries not already in CP437.

### 4.2 – Render each glyph

Use `@napi-rs/canvas`:

```ts
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

GlobalFonts.registerFromPath(ttfPath, fontFamily);

const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');
ctx.antialias = 'none';
ctx.fillStyle = 'white';
ctx.font = `${size}px "${fontFamily}"`;

// Baseline offset: from font metrics
const ascent = Math.round((font.ascender / font.unitsPerEm) * size);
ctx.fillText(String.fromCodePoint(codePoint), 0, ascent);
```

### 4.3 – Threshold pixel data

After rendering, read the raw pixel buffer and apply the threshold:

```ts
const imageData = ctx.getImageData(0, 0, size, size);
for (let i = 0; i < imageData.data.length; i += 4) {
  const alpha = imageData.data[i + 3];
  if (alpha > 0) {
    imageData.data[i]     = 255; // R → white
    imageData.data[i + 1] = 255; // G
    imageData.data[i + 2] = 255; // B
    imageData.data[i + 3] = 255; // A → fully opaque
  } else {
    imageData.data[i + 3] = 0;   // fully transparent
  }
}
```

This ensures zero anti-aliasing grey pixels survive into the output.

---

## Phase 5 – PNG writer

**File**: `src/utils/png.ts`

Use `pngjs` to convert the raw RGBA pixel buffer into a PNG file:

```ts
import { PNG } from 'pngjs';
import fs from 'node:fs';

export function writeGlyphPng(
  pixelData: Uint8ClampedArray,
  size: number,
  outputPath: string
): void {
  const png = new PNG({ width: size, height: size });
  png.data = Buffer.from(pixelData);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outputPath, buffer);
}
```

---

## Phase 6 – Manifest writer

**File**: `src/font/manifest.ts`

The manifest is written/updated at the end of each `bixel font` pass. On the second pass (Plus), it reads the existing manifest and merges.

### Manifest shape

```ts
type SpriteEntry = {
  codePoint: string;          // e.g. "U+0041"
  unicodeName: string;        // e.g. "LATIN CAPITAL LETTER A"
  file: string;               // e.g. "U0041.png"
  charsets: string[];         // e.g. ["cp437", "plus"]
  cp437Index?: number;        // 0–255 if in CP437
};

type FontManifest = {
  name: string;               // "IBM_BIOS"
  foundry: string;            // "IBM"
  generatedAt: string;        // ISO timestamp
  toolVersion: string;        // package version
  glyphSize: number;          // 8
  antiAliasing: false;
  sources: Array<{
    charset: string;          // "cp437" | "plus"
    ttfFile: string;          // original filename
    generatedAt: string;
  }>;
  sprites: SpriteEntry[];
};
```

Unicode character names: use the `unicode-name` npm package (`getUnicodeName(codePoint)`) — minimal, no large data bundle.

### File naming

`U{hex}.png` where hex is the code point zero-padded to 4 digits minimum:
- U+41 → `U0041.png`
- U+1F600 → `U1F600.png`

---

## Phase 7 – Run IBM BIOS generation

With the tool working, run the two passes for IBM BIOS:

```bash
# CP437 pass
node --import tsx/esm packages/bixelizer/src/cli.ts font \
  "resources/temp/oldschool_pc_font_pack_v2/ttf - Px (pixel outline)/Px437_IBM_BIOS.ttf" \
  --name IBM_BIOS --foundry IBM --charset cp437

# Extended Unicode pass
node --import tsx/esm packages/bixelizer/src/cli.ts font \
  "resources/temp/oldschool_pc_font_pack_v2/ttf - Px (pixel outline)/PxPlus_IBM_BIOS.ttf" \
  --name IBM_BIOS --foundry IBM --charset plus
```

Output: `resources/sprites/fonts/IBM_BIOS_IBM/`
- `U0000.png` … `U{XXXX}.png` — one per glyph
- `manifest.json`
- `Px437_IBM_BIOS.ttf` (copy)
- `PxPlus_IBM_BIOS.ttf` (copy)

Spot-check: visually inspect a sample of PNGs to confirm pixel-perfect 8×8 white-on-transparent output.

---

## Phase 8 – Storybook story

**File**: `packages/outside-storybook/src/stories/FontSprites.stories.tsx`

A simple React story that:
1. Imports `manifest.json` from `resources/sprites/fonts/IBM_BIOS_IBM/`
2. Groups sprites by Unicode block (Basic Latin, Latin-1, Box Drawing, etc.)
3. Renders each sprite as an `<img>` at 4× scale (32×32 px display, 8×8 px source)
4. Shows the Unicode code point and character name as a tooltip/caption

Story title: `FONTS/IBM BIOS`

The images are loaded as static assets — Vite serves them from the `resources/` directory (needs a Vite alias or symlink, or the story references them by relative path from the storybook's public folder).

**Note**: Storybook's Vite config may need a small adjustment to serve `resources/` as a static asset path. Check `packages/outside-storybook/vite.config.ts` — if a `publicDir` or `assetsInclude` setting is needed, add it.

---

## Verification

1. **CLI smoke test**: Run both passes, check exit code 0, inspect output folder exists with expected files.
2. **PNG spot-check**: Open a handful of PNGs (letter A, box-drawing char, CP437 smiley face U+263A) in any image viewer — should be 8×8 px, pure white pixels on transparent background, no grey anti-aliasing.
3. **Manifest check**: Open `manifest.json`, confirm sprite count matches expected glyph count (CP437 ≈ 256, Plus ≈ several hundred more), confirm `charsets` arrays are correct, confirm `cp437Index` is populated for CP437 entries.
4. **Storybook**: Run `pnpm storybook`, navigate to `FONTS/IBM BIOS`, confirm grid renders at 4× with visible glyphs across all Unicode blocks.
