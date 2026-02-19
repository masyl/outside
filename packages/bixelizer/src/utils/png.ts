import fs from 'node:fs';
import { PNG } from 'pngjs';

/**
 * Writes a raw RGBA pixel buffer to a PNG file.
 * Pixels with alpha > 0 should already be thresholded to full white before calling this.
 */
export function writeGlyphPng(
  pixelData: Uint8ClampedArray,
  width: number,
  height: number,
  outputPath: string
): void {
  const png = new PNG({ width, height });
  png.data = Buffer.from(pixelData);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outputPath, buffer);
}
