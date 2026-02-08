import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FLOOR_TILE_SPRITE_KEY,
  DEFAULT_WALL_TILE_SPRITE_KEY,
  floorTileVariants,
  pixelLandsDungeonsPack,
  wallTileVariants,
} from './meta';

describe('pixelLandsDungeonsPack manifest', () => {
  it('should include base floor and wall variants', () => {
    expect(floorTileVariants.some((variant) => variant.isBase)).toBe(true);
    expect(wallTileVariants.some((variant) => variant.isBase)).toBe(true);
    expect(
      floorTileVariants.some((variant) => variant.spriteKey === DEFAULT_FLOOR_TILE_SPRITE_KEY)
    ).toBe(true);
    expect(
      wallTileVariants.some((variant) => variant.spriteKey === DEFAULT_WALL_TILE_SPRITE_KEY)
    ).toBe(true);
  });

  it('should keep 16x16 tile frames aligned to grid without padding', () => {
    for (const variant of pixelLandsDungeonsPack.tileVariants) {
      expect(variant.frame.w).toBe(pixelLandsDungeonsPack.tileSize);
      expect(variant.frame.h).toBe(pixelLandsDungeonsPack.tileSize);
      expect(variant.frame.x % pixelLandsDungeonsPack.tileSize).toBe(0);
      expect(variant.frame.y % pixelLandsDungeonsPack.tileSize).toBe(0);
    }
  });

  it('should map requested source coordinates as [row, column]', () => {
    const byId = new Map(
      pixelLandsDungeonsPack.tileVariants.map((variant) => [variant.variantId, variant])
    );
    expect(byId.get('wall')?.sourceCell).toEqual({ x: 0, y: 0 });
    expect(byId.get('wall-cracked')?.sourceCell).toEqual({ x: 2, y: 4 });
    expect(byId.get('wall-mouse-hole')?.sourceCell).toEqual({ x: 2, y: 4 });
    expect(byId.get('floor')?.sourceCell).toEqual({ x: 3, y: 0 });
    expect(byId.get('floor-dirty')?.sourceCell).toEqual({ x: 4, y: 0 });
    expect(byId.get('floor-crack')?.sourceCell).toEqual({ x: 3, y: 1 });
    expect(byId.get('floor-crack-2')?.sourceCell).toEqual({ x: 4, y: 1 });
  });
});
