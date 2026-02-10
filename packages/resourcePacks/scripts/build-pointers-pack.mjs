import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const outputDir = path.resolve(__dirname, '../src/pointers');

const SOURCE_SHEET = path.resolve(repoRoot, 'agent-collab/light_cursor_spritesheet.png');
const OUTPUT_SHEET_NAME = 'light_cursor_spritesheet.png';
const OUTPUT_CURSOR_NAME = 'cursor-default.png';
const RETRIEVED_AT_ISO = '2026-02-10T00:00:00.000Z';

const SHEET_LAYOUT = {
  columns: 7,
  rows: 7,
  frameWidth: 16,
  frameHeight: 16,
};

const ROW_CATEGORIES = [
  'arrows',
  'rings',
  'crosses',
  'resizers',
  'curves',
  'actions',
  'utility',
];

function ensureSource() {
  if (!fs.existsSync(SOURCE_SHEET)) {
    throw new Error(`Missing source spritesheet: ${SOURCE_SHEET}`);
  }
}

function readPng(filePath) {
  const data = fs.readFileSync(filePath);
  const png = PNG.sync.read(data);
  return png;
}

function writePng(filePath, png) {
  const data = PNG.sync.write(png, {
    colorType: 6,
    inputColorType: 6,
  });
  fs.writeFileSync(filePath, data);
}

function cropFrame(source, x, y, w, h) {
  const out = new PNG({ width: w, height: h, colorType: 6 });
  out.data.fill(0);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const srcX = x + xx;
      const srcY = y + yy;
      if (srcX < 0 || srcY < 0 || srcX >= source.width || srcY >= source.height) continue;
      const srcIdx = (srcY * source.width + srcX) * 4;
      const dstIdx = (yy * w + xx) * 4;
      out.data[dstIdx] = source.data[srcIdx];
      out.data[dstIdx + 1] = source.data[srcIdx + 1];
      out.data[dstIdx + 2] = source.data[srcIdx + 2];
      out.data[dstIdx + 3] = source.data[srcIdx + 3];
    }
  }
  return out;
}

function buildPointers() {
  const pointers = [];
  for (let row = 0; row < SHEET_LAYOUT.rows; row++) {
    for (let col = 0; col < SHEET_LAYOUT.columns; col++) {
      pointers.push({
        variantId: `r${row}c${col}`,
        displayName: `Cursor ${row}:${col}`,
        spriteKey: `ui.cursor.r${row}c${col}`,
        category: ROW_CATEGORIES[row] ?? 'misc',
        frame: {
          x: col * SHEET_LAYOUT.frameWidth,
          y: row * SHEET_LAYOUT.frameHeight,
          w: SHEET_LAYOUT.frameWidth,
          h: SHEET_LAYOUT.frameHeight,
        },
        hotspot: {
          x: 1,
          y: 1,
        },
      });
    }
  }
  return pointers;
}

function buildManifest() {
  const pointers = buildPointers();
  return {
    id: 'simple-pixel-cursors-light',
    name: 'Simple Pixel Cursors (Light)',
    version: '1.0.0',
    type: 'pointer-pack',
    sheet: OUTPUT_SHEET_NAME,
    defaults: {
      baseVariantId: 'r0c0',
      interactiveVariantId: 'r0c0',
    },
    layout: SHEET_LAYOUT,
    credits: {
      creator: 'gabl18',
      homepage: 'https://gabl18.itch.io/simple-pixel-cursors',
      licenseName: 'Simple Pixel Cursors itch.io license',
      creditRequired: false,
      sourceDescription: 'Simple Pixel Cursors (Light Cursor Spritesheet)',
      retrievedAt: RETRIEVED_AT_ISO,
      restrictions: [
        'Follow the original itch.io pack license/terms for redistribution and usage.',
      ],
    },
    pointers,
    notes: [
      'Source spritesheet copied from agent-collab/light_cursor_spritesheet.png.',
      'Sheet interpreted as a 7x7 grid of 16x16 cursor cells.',
      'A default cursor asset is extracted from cell r0c0 for CSS cursor usage.',
    ],
  };
}

function writeManifestFiles(manifest) {
  const jsonPath = path.resolve(outputDir, 'light-cursors.pack.json');
  const tsPath = path.resolve(outputDir, 'light-cursors.pack.generated.ts');
  fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    tsPath,
    `export const lightCursorsPack = ${JSON.stringify(manifest, null, 2)} as const;\n\nexport default lightCursorsPack;\n`,
    'utf8'
  );
}

function writeLicense() {
  const licenseText = [
    '# Simple Pixel Cursors (Light) License and Attribution',
    '',
    '- Creator: gabl18',
    '- Source: https://gabl18.itch.io/simple-pixel-cursors',
    '- Retrieved: 2026-02-10',
    '',
    'Use and redistribution are subject to the original asset license on itch.io.',
  ].join('\n');
  fs.writeFileSync(path.resolve(outputDir, 'license.md'), `${licenseText}\n`, 'utf8');
}

function main() {
  ensureSource();
  fs.mkdirSync(outputDir, { recursive: true });

  const source = readPng(SOURCE_SHEET);
  const expectedWidth = SHEET_LAYOUT.columns * SHEET_LAYOUT.frameWidth;
  const expectedHeight = SHEET_LAYOUT.rows * SHEET_LAYOUT.frameHeight;
  if (source.width !== expectedWidth || source.height !== expectedHeight) {
    throw new Error(
      `Unexpected source dimensions ${source.width}x${source.height}; expected ${expectedWidth}x${expectedHeight}`
    );
  }

  fs.copyFileSync(SOURCE_SHEET, path.resolve(outputDir, OUTPUT_SHEET_NAME));

  const defaultFrame = cropFrame(source, 0, 0, SHEET_LAYOUT.frameWidth, SHEET_LAYOUT.frameHeight);
  writePng(path.resolve(outputDir, OUTPUT_CURSOR_NAME), defaultFrame);

  const manifest = buildManifest();
  writeManifestFiles(manifest);
  writeLicense();

  console.log('[resource-packs] Built pointers pack (Simple Pixel Cursors Light)');
}

main();
