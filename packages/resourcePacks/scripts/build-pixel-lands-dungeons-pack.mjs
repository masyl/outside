import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const sourceDir = path.resolve(repoRoot, 'agent-collab/Pixel Lands Dungeons Demo');
const outputDir = path.resolve(__dirname, '../src/pixel-lands-dungeons');

const sourceSheet = path.resolve(sourceDir, 'dungeons_demo.png');
const sourceInfo = path.resolve(sourceDir, 'INFO.txt');
const outputSheet = path.resolve(outputDir, 'pixel-lands-dungeons.atlas.png');
const outputManifestJson = path.resolve(outputDir, 'pixel-lands-dungeons.pack.json');
const outputManifestTs = path.resolve(outputDir, 'pixel-lands-dungeons.pack.generated.ts');
const outputLicense = path.resolve(outputDir, 'license.md');

const RETRIEVED_AT_ISO = '2026-02-08T00:00:00.000Z';
const TILE_SIZE = 16;
const TILE_PADDING = 0;

const tileVariants = [
  {
    variantId: 'wall',
    displayName: 'Wall',
    spriteKey: 'tile.wall',
    renderKind: 'wall',
    isBase: true,
    sourceCell: { x: 0, y: 0 },
  },
  {
    variantId: 'wall-cracked',
    displayName: 'Wall Cracked',
    spriteKey: 'tile.wall.cracked',
    renderKind: 'wall',
    isBase: false,
    sourceCell: { x: 4, y: 2 },
  },
  {
    variantId: 'wall-mouse-hole',
    displayName: 'Wall Mouse Hole',
    spriteKey: 'tile.wall.mouse-hole',
    renderKind: 'wall',
    isBase: false,
    sourceCell: { x: 4, y: 2 },
  },
  {
    variantId: 'floor',
    displayName: 'Floor',
    spriteKey: 'tile.floor',
    renderKind: 'floor',
    isBase: true,
    sourceCell: { x: 0, y: 3 },
  },
  {
    variantId: 'floor-dirty',
    displayName: 'Floor Dirty',
    spriteKey: 'tile.floor.dirty',
    renderKind: 'floor',
    isBase: false,
    sourceCell: { x: 0, y: 4 },
  },
  {
    variantId: 'floor-crack',
    displayName: 'Floor Crack',
    spriteKey: 'tile.floor.crack',
    renderKind: 'floor',
    isBase: false,
    sourceCell: { x: 1, y: 3 },
  },
  {
    variantId: 'floor-crack-2',
    displayName: 'Floor Crack 2',
    spriteKey: 'tile.floor.crack-2',
    renderKind: 'floor',
    isBase: false,
    sourceCell: { x: 1, y: 4 },
  },
];

function ensureSourceFiles() {
  if (!fs.existsSync(sourceSheet)) {
    throw new Error(`Missing source spritesheet: ${sourceSheet}`);
  }
  if (!fs.existsSync(sourceInfo)) {
    throw new Error(`Missing source metadata file: ${sourceInfo}`);
  }
}

function assertUniqueVariantIds() {
  const seen = new Set();
  for (const tile of tileVariants) {
    if (seen.has(tile.variantId)) {
      throw new Error(`Duplicate tile variant id: ${tile.variantId}`);
    }
    seen.add(tile.variantId);
  }
}

function buildManifest() {
  return {
    id: 'pixel-lands-dungeons-demo',
    name: 'Pixel Lands - Dungeons Demo',
    version: '1.0.0',
    type: 'dungeon-tiles',
    tileSize: TILE_SIZE,
    padding: TILE_PADDING,
    atlas: 'pixel-lands-dungeons.atlas.png',
    credits: {
      creator: 'Trislin Games',
      homepage: 'https://trislin.itch.io/pixel-lands-dungeons',
      license: 'Pixel Lands Dungeons Demo license (INFO.txt in source pack)',
      creditRequired: false,
      sourceDescription:
        'Demo subset of the Pixel Lands - Dungeons tileset with dungeon floor and wall tiles.',
      retrievedAt: RETRIEVED_AT_ISO,
    },
    tileVariants: tileVariants.map((tile) => ({
      variantId: tile.variantId,
      displayName: tile.displayName,
      spriteKey: tile.spriteKey,
      renderKind: tile.renderKind,
      isBase: tile.isBase,
      frame: {
        x: tile.sourceCell.x * TILE_SIZE,
        y: tile.sourceCell.y * TILE_SIZE,
        w: TILE_SIZE,
        h: TILE_SIZE,
      },
      sourceCell: tile.sourceCell,
    })),
    notes: [
      'Atlas is copied from agent-collab/Pixel Lands Dungeons Demo/dungeons_demo.png.',
      'Tile size is 16x16 with no padding.',
      'Renderer-side weighted selection uses 75% base tile and 25% variant tiles.',
      'Only the explicitly requested floor and wall tiles are included in this first pass.',
    ],
  };
}

function main() {
  ensureSourceFiles();
  assertUniqueVariantIds();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.copyFileSync(sourceSheet, outputSheet);

  const manifest = buildManifest();
  fs.writeFileSync(outputManifestJson, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    outputManifestTs,
    `export const pixelLandsDungeonsPack = ${JSON.stringify(
      manifest,
      null,
      2
    )} as const;\n\nexport default pixelLandsDungeonsPack;\n`,
    'utf8'
  );

  const infoText = fs.readFileSync(sourceInfo, 'utf8').trim();
  const licenseText =
    '# Pixel Lands Dungeons Demo License and Attribution\n\n' + `${infoText}\n`;
  fs.writeFileSync(outputLicense, `${licenseText}\n`, 'utf8');

  console.log('[resource-packs] Built Pixel Lands Dungeons demo tile pack');
}

main();
