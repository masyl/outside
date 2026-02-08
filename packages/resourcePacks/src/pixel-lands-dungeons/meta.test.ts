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
});
