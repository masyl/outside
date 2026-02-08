import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const sourceDir = path.resolve(repoRoot, 'agent-collab/Pixel Platter');
const outputDir = path.resolve(__dirname, '../src/pixel-platter');

const TILE_SIZE = 16;
const PADDING = 2;
const STRIDE = TILE_SIZE + PADDING * 2;
const COLUMNS = 8;
const RETRIEVED_AT_ISO = '2026-02-08T00:00:00.000Z';

const variants = [
  { variantId: 'french-fries', displayName: 'French Fries', sourceFile: 'French_fries.png' },
  { variantId: 'burger', displayName: 'Burger', sourceFile: 'Burger.png' },
  { variantId: 'soda', displayName: 'Soda', sourceFile: 'Soda.png' },
  { variantId: 'pizza-slice', displayName: 'Pizza Slice', sourceFile: 'Pizza.png' },
  { variantId: 'hotdog', displayName: 'Hotdog', sourceFile: 'Hotdog.png' },
  { variantId: 'hotdog-mustard', displayName: 'Hotdog w/ Mustard', sourceFile: 'Hotdog_mustard.png' },
  { variantId: 'pumpkin-pie-slice', displayName: 'Pumpkin Pie Slice', sourceFile: 'Pie_pumpkin.png' },
  { variantId: 'macarons', displayName: 'Macarons', sourceFile: 'Macarons.png' },
  { variantId: 'red-velvet-cake-slice', displayName: 'Red Velvet Cake Slice', sourceFile: 'Cake_red_velvet.png' },
  { variantId: 'tiramisu', displayName: 'Tiramisu', sourceFile: 'Tiramisu.png' },
  {
    variantId: 'ice-cream-sandwich',
    displayName: 'Ice Cream Sandwich',
    sourceFile: 'IceCream_sandwich.png',
  },
  { variantId: 'creme-brulee', displayName: 'Creme Brulee', sourceFile: 'Creme_brulee.png' },
  { variantId: 'orange', displayName: 'Orange', sourceFile: 'Fruit_orange.png' },
  { variantId: 'apple', displayName: 'Apple', sourceFile: 'Fruit_apple.png' },
  { variantId: 'banana', displayName: 'Banana', sourceFile: 'Fruit_banana.png' },
  { variantId: 'pear', displayName: 'Pear', sourceFile: 'Fruit_pear.png' },
  { variantId: 'cherry', displayName: 'Cherry', sourceFile: 'Fruit_cherry.png' },
  { variantId: 'lemon', displayName: 'Lemon', sourceFile: 'Fruit_lemon.png' },
  { variantId: 'grapes', displayName: 'Grapes', sourceFile: 'Fruit_grapes.png' },
  { variantId: 'strawberry', displayName: 'Strawberry', sourceFile: 'Fruit_strawberry.png' },
  { variantId: 'raspberry', displayName: 'Raspberry', sourceFile: 'Fruit_raspberry.png' },
  { variantId: 'kiwi', displayName: 'Kiwi', sourceFile: 'Fruit_kiwi.png' },
];

const itemsFromHomepage = variants.map((entry) => entry.displayName);

function assertUniqueVariantIds() {
  const ids = new Set();
  for (const variant of variants) {
    if (ids.has(variant.variantId)) {
      throw new Error(`Duplicate variant id: ${variant.variantId}`);
    }
    ids.add(variant.variantId);
  }
}

function readPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  return PNG.sync.read(buffer);
}

function writePng(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
}

function blit(source, target, destX, destY) {
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const srcIndex = (source.width * y + x) << 2;
      const dstX = destX + x;
      const dstY = destY + y;
      const dstIndex = (target.width * dstY + dstX) << 2;
      target.data[dstIndex] = source.data[srcIndex];
      target.data[dstIndex + 1] = source.data[srcIndex + 1];
      target.data[dstIndex + 2] = source.data[srcIndex + 2];
      target.data[dstIndex + 3] = source.data[srcIndex + 3];
    }
  }
}

function ensureInputsExist() {
  for (const variant of variants) {
    const filePath = path.resolve(sourceDir, variant.sourceFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing source file: ${filePath}`);
    }
  }
}

function buildAtlasAndManifest() {
  const rows = Math.ceil(variants.length / COLUMNS);
  const atlasWidth = COLUMNS * STRIDE;
  const atlasHeight = rows * STRIDE;
  const atlas = new PNG({ width: atlasWidth, height: atlasHeight, colorType: 6 });
  atlas.data.fill(0);

  const foodVariants = [];

  for (let index = 0; index < variants.length; index++) {
    const variant = variants[index];
    const sourcePath = path.resolve(sourceDir, variant.sourceFile);
    const source = readPng(sourcePath);

    if (source.width > TILE_SIZE || source.height > TILE_SIZE) {
      throw new Error(
        `Source sprite larger than ${TILE_SIZE}x${TILE_SIZE}: ${variant.sourceFile} (${source.width}x${source.height})`
      );
    }

    const col = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const tileX = col * STRIDE + PADDING;
    const tileY = row * STRIDE + PADDING;

    const destX = tileX + Math.floor((TILE_SIZE - source.width) / 2);
    const bottomInset = Math.min(2, Math.max(0, TILE_SIZE - source.height));
    const destY = tileY + (TILE_SIZE - bottomInset - source.height);

    if (destY < tileY) {
      throw new Error(`Bottom alignment overflow for ${variant.sourceFile}`);
    }

    blit(source, atlas, destX, destY);

    foodVariants.push({
      variantId: variant.variantId,
      displayName: variant.displayName,
      spriteKey: `pickup.food.${variant.variantId}`,
      frame: {
        x: tileX,
        y: tileY,
        w: TILE_SIZE,
        h: TILE_SIZE,
      },
      sourceFile: variant.sourceFile,
    });
  }

  return {
    atlas,
    manifest: {
      id: 'pixel-platter',
      name: 'Pixel Platter',
      version: '1.0.0',
      type: 'food-icons',
      tileSize: TILE_SIZE,
      padding: PADDING,
      atlas: 'pixel-platter.atlas.png',
      credits: {
        creator: 'Netherzapdos',
        homepage: 'https://netherzapdos.itch.io/pixel-platter',
        license: 'CC0 1.0 Universal (as listed on the pack homepage listing)',
        creditRequired: false,
        sourceDescription: '16x16 Food Assets with a Simplistic Style!',
        retrievedAt: RETRIEVED_AT_ISO,
      },
      foodVariants,
      itemsFromHomepage,
      notes: [
        'Atlas generated from source PNG files in agent-collab/Pixel Platter.',
        'Each frame occupies a 16x16 tile with 2px outer padding per cell.',
        'Sprites smaller than 16x16 are horizontally centered and aligned 2px above tile bottom.',
      ],
    },
  };
}

function writeLicenseFile() {
  const text = `# Pixel Platter License and Attribution\n\n` +
    `Pack: Pixel Platter - Free 2D Simple Food Sprites!\n` +
    `Author: Netherzapdos\n` +
    `Homepage: https://netherzapdos.itch.io/pixel-platter\n\n` +
    `License\n` +
    `- CC0 1.0 Universal (as listed on the pack homepage listing).\n` +
    `- Credit is not required, but attribution is preserved in this repository metadata.\n\n` +
    `Homepage description\n` +
    `- \"16x16 Food Assets with a Simplistic Style!\"\n` +
    `- \"Make your projects look extra delectable with these free food assets!\"\n\n` +
    `Included food items\n` +
    itemsFromHomepage.map((item) => `- ${item}`).join('\n') +
    `\n`;
  fs.writeFileSync(path.resolve(outputDir, 'license.md'), text, 'utf8');
}

function main() {
  assertUniqueVariantIds();
  ensureInputsExist();
  fs.mkdirSync(outputDir, { recursive: true });

  const { atlas, manifest } = buildAtlasAndManifest();

  writePng(path.resolve(outputDir, 'pixel-platter.atlas.png'), atlas);
  fs.writeFileSync(
    path.resolve(outputDir, 'pixel-platter.pack.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.resolve(outputDir, 'pixel-platter.pack.generated.ts'),
    `export const pixelPlatterPack = ${JSON.stringify(manifest, null, 2)} as const;\n\nexport default pixelPlatterPack;\n`,
    'utf8'
  );
  writeLicenseFile();

  console.log(
    `[resource-packs] Built Pixel Platter atlas: ${manifest.foodVariants.length} variants -> ${manifest.atlas}`
  );
}

main();
