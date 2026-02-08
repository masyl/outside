import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const sourceDir = path.resolve(
  repoRoot,
  'agent-collab/Paws & Whiskers - Isometric Dogs Pack (Free)'
);
const outputDir = path.resolve(__dirname, '../src/paws-whiskers');

const sourceSheet = path.resolve(sourceDir, 'GoldenRetriever_spritesheet_free.png');
const sourceReadme = path.resolve(sourceDir, 'readme_free.txt');

const outputSheet = path.resolve(outputDir, 'golden-retriever.spritesheet.png');
const outputManifestJson = path.resolve(outputDir, 'golden-retriever.pack.json');
const outputManifestTs = path.resolve(outputDir, 'golden-retriever.pack.generated.ts');
const outputLicense = path.resolve(outputDir, 'license.md');

const RETRIEVED_AT_ISO = '2026-02-08T00:00:00.000Z';

function ensureSourceFiles() {
  if (!fs.existsSync(sourceSheet)) {
    throw new Error(`Missing source spritesheet: ${sourceSheet}`);
  }
  if (!fs.existsSync(sourceReadme)) {
    throw new Error(`Missing source readme: ${sourceReadme}`);
  }
}

function buildManifest() {
  return {
    id: 'paws-whiskers-golden-retriever',
    name: 'Paws & Whiskers Isometric Dogs Pack (Free) - Golden Retriever',
    version: '1.0.0',
    type: 'actor-variant',
    sheet: 'golden-retriever.spritesheet.png',
    credits: {
      creator: 'Netherzapdos',
      homepage: 'https://netherzapdos.itch.io/paws-whiskers-isometric-dogs-pack',
      licenseName: 'Paws & Whiskers Free Pack License',
      creditRequired: false,
      sourceDescription: 'Paws & Whiskers - Isometric Dogs Pack Free Version',
      retrievedAt: RETRIEVED_AT_ISO,
      restrictions: [
        'Use allowed for non-commercial projects.',
        'Do not resell or redistribute assets, modified or unmodified.',
        'Do not use assets as basis for AI-generated content.',
      ],
    },
    actorVariant: {
      variantId: 'golden-retriever',
      displayName: 'Golden Retriever',
      botSpriteKey: 'actor.bot.golden-retriever',
      heroSpriteKey: 'actor.hero.golden-retriever',
      animation: {
        frameWidth: 16,
        frameHeight: 16,
        frameCount: 4,
        directionCount: 8,
        idleRow: 0,
        walkRow: 1,
        framePitchX: 32,
        framePitchY: 31,
        frameInsetX: 8,
        frameInsetY: 8,
        directionOrder: [
          'bottom',
          'bottom-left',
          'right',
          'top-right',
          'top',
          'top-left',
          'left',
          'bottom-right',
        ],
        cardinalDirectionToGroup: {
          down: 0,
          right: 2,
          up: 4,
          left: 6,
        },
      },
    },
    notes: [
      'Source sheet copied from agent-collab/Paws & Whiskers - Isometric Dogs Pack (Free).',
      'Frame layout extracted from source image dimensions and provided pack notes.',
      'This pack provides actor variant keys for bots and heroes.',
    ],
  };
}

function main() {
  ensureSourceFiles();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.copyFileSync(sourceSheet, outputSheet);

  const manifest = buildManifest();
  fs.writeFileSync(outputManifestJson, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    outputManifestTs,
    `export const goldenRetrieverPack = ${JSON.stringify(manifest, null, 2)} as const;\n\nexport default goldenRetrieverPack;\n`,
    'utf8'
  );

  const readme = fs.readFileSync(sourceReadme, 'utf8').trim();
  const licenseText = `# Paws & Whiskers Golden Retriever License and Attribution\n\n${readme}\n`;
  fs.writeFileSync(outputLicense, `${licenseText}\n`, 'utf8');

  console.log('[resource-packs] Built Paws & Whiskers Golden Retriever pack');
}

main();
