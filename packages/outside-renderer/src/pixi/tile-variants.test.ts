import { describe, expect, it } from 'vitest';
import { pickTileVariant } from './tile-variants';

describe('pickTileVariant', () => {
  it('should return only base when no variants exist', () => {
    const pool = { base: 'base', variants: [] as string[] };
    expect(
      pickTileVariant(pool, { kind: 'floor', worldX: 0, worldY: 0, eid: 1 })
    ).toBe('base');
  });

  it('should return variant when base is missing', () => {
    const pool = { base: null, variants: ['v1', 'v2'] as string[] };
    const value = pickTileVariant(pool, { kind: 'wall', worldX: 10, worldY: 10, eid: 5 });
    expect(value === 'v1' || value === 'v2').toBe(true);
  });

  it('should stay deterministic for same tile coordinates', () => {
    const pool = { base: 'base', variants: ['v1', 'v2'] as string[] };
    const first = pickTileVariant(pool, { kind: 'floor', worldX: 4, worldY: 2, eid: 17 });
    const second = pickTileVariant(pool, { kind: 'floor', worldX: 4, worldY: 2, eid: 17 });
    expect(second).toBe(first);
  });

  it('should approximate 75/25 base-to-variant weighting', () => {
    const pool = { base: 'base', variants: ['v1', 'v2', 'v3'] as string[] };
    let baseCount = 0;
    const samples = 1000;
    for (let i = 0; i < samples; i++) {
      const pick = pickTileVariant(pool, {
        kind: 'wall',
        worldX: i % 80,
        worldY: Math.floor(i / 80),
        eid: 1000 + i,
      });
      if (pick === 'base') baseCount += 1;
    }
    const ratio = baseCount / samples;
    expect(ratio).toBeGreaterThan(0.70);
    expect(ratio).toBeLessThan(0.80);
  });
});
