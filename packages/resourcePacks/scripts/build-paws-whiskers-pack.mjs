import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const outputDir = path.resolve(__dirname, '../src/paws-whiskers');

const RETRIEVED_AT_ISO = '2026-02-08T00:00:00.000Z';

const PACKS = [
  {
    sourceDir: path.resolve(__dirname, '../sources/paws-whiskers/dogs'),
    sourceSheetName: 'GoldenRetriever_spritesheet_free.png',
    sourceReadmeName: 'readme_free.txt',
    outputBaseName: 'golden-retriever',
    id: 'paws-whiskers-golden-retriever',
    name: 'Paws & Whiskers Isometric Dogs Pack (Free) - Golden Retriever',
    homepage: 'https://netherzapdos.itch.io/paws-whiskers-isometric-dogs-pack',
    sourceDescription: 'Paws & Whiskers - Isometric Dogs Pack Free Version',
    variantId: 'golden-retriever',
    displayName: 'Golden Retriever',
    botSpriteKey: 'actor.bot.golden-retriever',
    heroSpriteKey: 'actor.hero.golden-retriever',
    licenseTitle: 'Paws & Whiskers Golden Retriever License and Attribution',
    legacyLicenseFile: 'license.md',
  },
  {
    sourceDir: path.resolve(__dirname, '../sources/paws-whiskers/cats'),
    sourceSheetName: 'Cat_1_spritesheet_free.png',
    sourceReadmeName: 'readme_free.txt',
    outputBaseName: 'beige-cat',
    id: 'paws-whiskers-beige-cat',
    name: 'Paws & Whiskers Isometric Cats Pack (Free) - Beige Cat',
    homepage: 'https://netherzapdos.itch.io/paws-whiskers-isometric-cats-pack',
    sourceDescription: 'Paws & Whiskers - Isometric Cats Pack Free Version',
    variantId: 'beige-cat',
    displayName: 'Beige Cat',
    botSpriteKey: 'actor.bot.beige-cat',
    heroSpriteKey: 'actor.hero.beige-cat',
    licenseTitle: 'Paws & Whiskers Beige Cat License and Attribution',
  },
];

function ensureSourceFiles(pack) {
  const sourceSheet = path.resolve(pack.sourceDir, pack.sourceSheetName);
  const sourceReadme = path.resolve(pack.sourceDir, pack.sourceReadmeName);
  if (!fs.existsSync(sourceSheet)) {
    throw new Error(`Missing source spritesheet: ${sourceSheet}`);
  }
  if (!fs.existsSync(sourceReadme)) {
    throw new Error(`Missing source readme: ${sourceReadme}`);
  }
}

function buildManifest(pack) {
  return {
    id: pack.id,
    name: pack.name,
    version: '1.0.0',
    type: 'actor-variant',
    sheet: `${pack.outputBaseName}.spritesheet.png`,
    credits: {
      creator: 'Netherzapdos',
      homepage: pack.homepage,
      licenseName: 'Paws & Whiskers Free Pack License',
      creditRequired: false,
      sourceDescription: pack.sourceDescription,
      retrievedAt: RETRIEVED_AT_ISO,
      restrictions: [
        'Use allowed for non-commercial projects.',
        'Do not resell or redistribute assets, modified or unmodified.',
        'Do not use assets as basis for AI-generated content.',
      ],
    },
    actorVariant: {
      variantId: pack.variantId,
      displayName: pack.displayName,
      botSpriteKey: pack.botSpriteKey,
      heroSpriteKey: pack.heroSpriteKey,
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
        frameInsetY: 9,
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
          down: 4,
          right: 2,
          up: 0,
          left: 6,
        },
      },
    },
    notes: [
      `Source sheet copied from ${path.relative(repoRoot, pack.sourceDir)}.`,
      'Frame layout extracted from source image dimensions and provided pack notes.',
      'This pack provides actor variant keys for bots and heroes.',
    ],
  };
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const pack of PACKS) {
    ensureSourceFiles(pack);

    const sourceSheet = path.resolve(pack.sourceDir, pack.sourceSheetName);
    const sourceReadme = path.resolve(pack.sourceDir, pack.sourceReadmeName);
    const outputSheet = path.resolve(outputDir, `${pack.outputBaseName}.spritesheet.png`);
    const outputManifestJson = path.resolve(outputDir, `${pack.outputBaseName}.pack.json`);
    const outputManifestTs = path.resolve(outputDir, `${pack.outputBaseName}.pack.generated.ts`);
    const outputLicense = path.resolve(outputDir, `${pack.outputBaseName}.license.md`);

    fs.copyFileSync(sourceSheet, outputSheet);

    const manifest = buildManifest(pack);
    fs.writeFileSync(outputManifestJson, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    fs.writeFileSync(
      outputManifestTs,
      `export const ${camelPackConstant(pack.outputBaseName)}Pack = ${JSON.stringify(
        manifest,
        null,
        2
      )} as const;\n\nexport default ${camelPackConstant(pack.outputBaseName)}Pack;\n`,
      'utf8'
    );

    const readme = fs.readFileSync(sourceReadme, 'utf8').trim();
    const licenseText = `# ${pack.licenseTitle}\n\n${readme}\n`;
    fs.writeFileSync(outputLicense, `${licenseText}\n`, 'utf8');
    if (pack.legacyLicenseFile) {
      fs.writeFileSync(path.resolve(outputDir, pack.legacyLicenseFile), `${licenseText}\n`, 'utf8');
    }

    console.log(`[resource-packs] Built ${pack.displayName} actor pack`);
  }
}

function camelPackConstant(value) {
  return value
    .split('-')
    .map((part, index) => (index === 0 ? part : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`))
    .join('');
}

main();
