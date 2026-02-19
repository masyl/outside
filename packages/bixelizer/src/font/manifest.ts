import fs from 'node:fs';
import path from 'node:path';

export type Charset = 'cp437' | 'plus';

export type SpriteEntry = {
  codePoint: string;       // e.g. "U+0041"
  unicodeName: string;     // e.g. "LATIN CAPITAL LETTER A"
  file: string;            // e.g. "U0041.png"
  charsets: Charset[];     // which character sets include this glyph
  cp437Index?: number;     // 0–255 if present in CP437
};

export type SourceEntry = {
  charset: Charset;
  ttfFile: string;         // original basename of the TTF
  generatedAt: string;     // ISO timestamp
};

export type FontManifest = {
  name: string;
  foundry: string;
  glyphWidth: number;
  glyphHeight: number;
  antiAliasing: false;
  toolVersion: string;
  sources: SourceEntry[];
  sprites: SpriteEntry[];
};

const TOOL_VERSION = '0.1.0';

/** Formats a code point as "U+XXXX" (min 4 hex digits). */
export function formatCodePoint(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** Formats a code point as filename stem "UXXXX" (min 4 hex digits). */
export function codePointToFilename(cp: number): string {
  return `U${cp.toString(16).toUpperCase().padStart(4, '0')}.png`;
}

/**
 * Loads existing manifest from outputDir, or returns a fresh one.
 */
export function loadOrCreateManifest(
  outputDir: string,
  name: string,
  foundry: string,
  glyphWidth: number,
  glyphHeight: number
): FontManifest {
  const manifestPath = path.join(outputDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw) as FontManifest;
  }
  return {
    name,
    foundry,
    glyphWidth,
    glyphHeight,
    antiAliasing: false,
    toolVersion: TOOL_VERSION,
    sources: [],
    sprites: [],
  };
}

/**
 * Merges new sprite entries into an existing manifest (deduplicates by codePoint,
 * merges charsets if the sprite already exists).
 */
export function mergeSprites(
  manifest: FontManifest,
  newSprites: SpriteEntry[],
  sourceEntry: SourceEntry
): FontManifest {
  // Add or update source record
  const existingSourceIdx = manifest.sources.findIndex(
    (s) => s.charset === sourceEntry.charset
  );
  if (existingSourceIdx >= 0) {
    manifest.sources[existingSourceIdx] = sourceEntry;
  } else {
    manifest.sources.push(sourceEntry);
  }

  // Merge sprites
  const byCodePoint = new Map<string, SpriteEntry>(
    manifest.sprites.map((s) => [s.codePoint, s])
  );
  for (const sprite of newSprites) {
    const existing = byCodePoint.get(sprite.codePoint);
    if (existing) {
      // Merge charsets without duplicates
      for (const cs of sprite.charsets) {
        if (!existing.charsets.includes(cs)) {
          existing.charsets.push(cs);
        }
      }
    } else {
      byCodePoint.set(sprite.codePoint, { ...sprite });
    }
  }

  // Sort by code point value for stable output
  manifest.sprites = Array.from(byCodePoint.values()).sort((a, b) => {
    const cpA = parseInt(a.codePoint.slice(2), 16);
    const cpB = parseInt(b.codePoint.slice(2), 16);
    return cpA - cpB;
  });

  return manifest;
}

/** Writes the manifest to disk as formatted JSON. */
export function saveManifest(outputDir: string, manifest: FontManifest): void {
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}
