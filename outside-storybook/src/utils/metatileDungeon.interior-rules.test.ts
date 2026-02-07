/**
 * Validate that MetaTile interior generation returns empty 14×14 and assemble produces correct layout.
 * Run with: pnpm exec vitest run src/utils/metatileDungeon.interior-rules.test.ts (from outside-storybook)
 * or from repo root: pnpm --filter outside-storybook test
 */
import { describe, it, expect } from 'vitest';
import {
  generateSingleFrame,
  generateInteriorForFrame,
  assembleMetaTile,
  type TileKind,
  INTERIOR_SIZE_EXPORT as INTERIOR_SIZE,
} from './metatileDungeon';

const META_SIZE = 16;

describe('MetaTile interior (empty placeholder)', () => {
  it('generateInteriorForFrame returns 14×14 all empty', () => {
    const frame = generateSingleFrame(0);
    const interior = generateInteriorForFrame(frame, 42);
    expect(interior.length).toBe(INTERIOR_SIZE);
    expect(interior[0].length).toBe(INTERIOR_SIZE);
    for (let x = 0; x < INTERIOR_SIZE; x++) {
      for (let y = 0; y < INTERIOR_SIZE; y++) {
        expect(interior[x][y]).toBe('empty');
      }
    }
  });

  it('assembleMetaTile with empty interior has frame on border and empty in center', () => {
    const frame = generateSingleFrame(0);
    const interior = generateInteriorForFrame(frame, 100);
    const tile = assembleMetaTile(frame, interior);
    expect(tile.length).toBe(META_SIZE);
    expect(tile[0].length).toBe(META_SIZE);
    // Border (row 0, row 15, col 0, col 15) comes from frame
    for (let i = 0; i < META_SIZE; i++) {
      expect(['empty', 'wall', 'floor']).toContain(tile[i][0]);
      expect(['empty', 'wall', 'floor']).toContain(tile[i][META_SIZE - 1]);
      expect(['empty', 'wall', 'floor']).toContain(tile[0][i]);
      expect(['empty', 'wall', 'floor']).toContain(tile[META_SIZE - 1][i]);
    }
    // Center 14×14 is empty
    for (let x = 1; x <= INTERIOR_SIZE; x++) {
      for (let y = 1; y <= INTERIOR_SIZE; y++) {
        expect(tile[x][y]).toBe('empty');
      }
    }
  });
});
