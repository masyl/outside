import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderFont } from '../font/renderer.js';
import {
  loadOrCreateManifest,
  mergeSprites,
  saveManifest,
  type Charset,
} from '../font/manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// src/commands/ → src/ → package root → packages/ → repo root
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function usage(): void {
  console.log(`
Usage: bixel font <ttf-path> --name <name> --foundry <foundry> --charset <cp437|plus> [--output <dir>] [--size <n>] [--width <w>] [--height <h>]

Options:
  --name      Font name used for the output folder  (e.g. IBM_BIOS)
  --foundry   Foundry or source name                (e.g. IBM)
  --charset   Character set: cp437 or plus
  --output    Output root directory                 (default: resources/sprites/fonts)
  --size      Glyph size (square): sets both width and height (default: 8)
  --width     Glyph width in px  (overrides --size width component)
  --height    Glyph height in px (overrides --size height component)
`);
}

export function runFontCommand(args: string[]): void {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    usage();
    process.exit(0);
  }

  const ttfPath = path.resolve(args[0]);

  if (!fs.existsSync(ttfPath)) {
    console.error(`Error: TTF file not found: ${ttfPath}`);
    process.exit(1);
  }

  // Parse named args
  const named: Record<string, string> = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i];
    const val = args[i + 1];
    if (!key.startsWith('--') || val === undefined) {
      console.error(`Error: unexpected argument: ${key}`);
      usage();
      process.exit(1);
    }
    named[key.slice(2)] = val;
  }

  const name = named['name'];
  const foundry = named['foundry'];
  const charsetRaw = named['charset'];
  const outputRoot = named['output']
    ? path.resolve(named['output'])
    : path.resolve(REPO_ROOT, 'resources', 'sprites', 'fonts');

  const baseSize = named['size'] ? parseInt(named['size'], 10) : 8;
  const glyphWidth = named['width'] ? parseInt(named['width'], 10) : baseSize;
  const glyphHeight = named['height'] ? parseInt(named['height'], 10) : baseSize;

  if (!name || !foundry || !charsetRaw) {
    console.error('Error: --name, --foundry, and --charset are required.');
    usage();
    process.exit(1);
  }

  if (charsetRaw !== 'cp437' && charsetRaw !== 'plus') {
    console.error(`Error: --charset must be "cp437" or "plus", got: ${charsetRaw}`);
    process.exit(1);
  }
  const charset = charsetRaw as Charset;

  const outputDir = path.join(outputRoot, `${name}_${foundry}`);

  console.log(`\n▶ bixel font`);
  console.log(`  TTF:     ${ttfPath}`);
  console.log(`  Charset: ${charset}`);
  console.log(`  Size:    ${glyphWidth}×${glyphHeight}px`);
  console.log(`  Output:  ${outputDir}\n`);

  // Load or create manifest
  const manifest = loadOrCreateManifest(outputDir, name, foundry, glyphWidth, glyphHeight);

  // Render glyphs
  const { sprites, ttfBasename } = renderFont({
    ttfPath,
    charset,
    glyphWidth,
    glyphHeight,
    outputDir,
  });

  // Merge into manifest
  const sourceEntry = {
    charset,
    ttfFile: ttfBasename,
    generatedAt: new Date().toISOString(),
  };
  const updated = mergeSprites(manifest, sprites, sourceEntry);

  // Save manifest
  saveManifest(outputDir, updated);

  console.log(`✔ Rendered ${sprites.length} glyphs`);
  console.log(`✔ Manifest: ${path.join(outputDir, 'manifest.json')}`);
  console.log(`✔ Total sprites in manifest: ${updated.sprites.length}\n`);
}
