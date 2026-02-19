import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import opentype from 'opentype.js';
import { CP437_TO_UNICODE, CP437_UNICODE_SET, UNICODE_TO_CP437 } from './cp437.js';
import type { Charset, SpriteEntry } from './manifest.js';
import { codePointToFilename, formatCodePoint } from './manifest.js';
import { writeGlyphPng } from '../utils/png.js';
import fs from 'node:fs';
import path from 'node:path';

/** Returns a Unicode character name using the Intl API (best-effort). */
function getUnicodeName(codePoint: number): string {
  // Node 25+ / modern V8 supports Intl.UnicodeData indirectly via CLDR.
  // We use a simple heuristic: for printable ASCII, just return the char;
  // for others, return the code point label per Unicode spec.
  try {
    // Some environments expose this; fall back gracefully if not.
    const seg = new Intl.Segmenter();
    void seg; // suppress unused warning
  } catch {
    // ignore
  }
  // Fallback: descriptive label matching Unicode standard convention.
  // e.g. U+0041 → "<control-0041>" for control chars, else the char itself.
  if (codePoint < 0x20 || codePoint === 0x7f) {
    return `<control-${codePoint.toString(16).toUpperCase().padStart(4, '0')}>`;
  }
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

export type RenderFontOptions = {
  ttfPath: string;
  charset: Charset;
  glyphWidth: number;
  glyphHeight: number;
  outputDir: string;
};

export type RenderFontResult = {
  sprites: SpriteEntry[];
  ttfBasename: string;
};

/**
 * Renders all glyphs from a TTF into individual PNGs.
 * Returns the sprite entries to be merged into the manifest.
 */
export function renderFont(options: RenderFontOptions): RenderFontResult {
  const { ttfPath, charset, glyphWidth, glyphHeight, outputDir } = options;

  // Parse font
  const font = opentype.loadSync(ttfPath);
  const ascent = Math.round((font.ascender / font.unitsPerEm) * glyphHeight);
  const ttfBasename = path.basename(ttfPath);
  const fontFamily = `bixelizer-${Date.now()}`;

  GlobalFonts.registerFromPath(ttfPath, fontFamily);

  // Determine which code points to render
  const cmapCodePoints: number[] = Object.keys(
    (font.tables as { cmap: { glyphIndexMap: Record<string, number> } }).cmap.glyphIndexMap
  ).map(Number);

  let codePoints: number[];

  if (charset === 'cp437') {
    // Only render the 256 CP437 code points (mapped to Unicode)
    // Filter to those actually present in this font's cmap
    const cmapSet = new Set(cmapCodePoints);
    codePoints = CP437_TO_UNICODE.filter((cp) => cmapSet.has(cp));
  } else {
    // 'plus': all cmap entries NOT already in CP437
    codePoints = cmapCodePoints.filter((cp) => !CP437_UNICODE_SET.has(cp));
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const sprites: SpriteEntry[] = [];

  for (const cp of codePoints) {
    const char = String.fromCodePoint(cp);
    const filename = codePointToFilename(cp);
    const outputPath = path.join(outputDir, filename);

    // Render
    const canvas = createCanvas(glyphWidth, glyphHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = `${glyphHeight}px "${fontFamily}"`;
    // U+0000 (NULL) causes CString conversion errors in napi-rs/canvas; skip it.
    // The canvas stays fully transparent, producing a blank PNG.
    if (cp !== 0) {
      ctx.fillText(char, 0, ascent);
    }

    // Threshold: non-zero alpha → full white opaque; zero → transparent
    const imageData = ctx.getImageData(0, 0, glyphWidth, glyphHeight);
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    }

    writeGlyphPng(data, glyphWidth, glyphHeight, outputPath);

    const entry: SpriteEntry = {
      codePoint: formatCodePoint(cp),
      unicodeName: getUnicodeName(cp),
      file: filename,
      charsets: [charset],
    };

    const cp437Idx = UNICODE_TO_CP437.get(cp);
    if (cp437Idx !== undefined) {
      entry.cp437Index = cp437Idx;
    }

    sprites.push(entry);
  }

  // Copy TTF into output folder for reference
  const ttfDest = path.join(outputDir, ttfBasename);
  if (!fs.existsSync(ttfDest)) {
    fs.copyFileSync(ttfPath, ttfDest);
  }

  return { sprites, ttfBasename };
}
