import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FOOD_SPRITE_KEY,
  foodVariantIds,
  foodVariantToSpriteKey,
  pixelPlatterPack,
} from './meta';

describe('pixelPlatterPack manifest', () => {
  it('should contain unique, sorted variant identifiers', () => {
    expect(foodVariantIds.length).toBeGreaterThan(0);
    const unique = new Set(foodVariantIds);
    expect(unique.size).toBe(foodVariantIds.length);
    const manifestIds = pixelPlatterPack.foodVariants.map((variant) => variant.variantId);
    expect(manifestIds).toEqual([...foodVariantIds]);
  });

  it('should keep atlas frames inside atlas bounds', () => {
    const columns = 8;
    const stride = pixelPlatterPack.tileSize + pixelPlatterPack.padding * 2;
    const rows = Math.ceil(pixelPlatterPack.foodVariants.length / columns);
    const atlasWidth = columns * stride;
    const atlasHeight = rows * stride;

    for (const variant of pixelPlatterPack.foodVariants) {
      expect(variant.frame.w).toBe(pixelPlatterPack.tileSize);
      expect(variant.frame.h).toBe(pixelPlatterPack.tileSize);
      expect(variant.frame.x).toBeGreaterThanOrEqual(0);
      expect(variant.frame.y).toBeGreaterThanOrEqual(0);
      expect(variant.frame.x + variant.frame.w).toBeLessThanOrEqual(atlasWidth);
      expect(variant.frame.y + variant.frame.h).toBeLessThanOrEqual(atlasHeight);
    }
  });

  it('should derive sprite keys consistently', () => {
    for (const variant of pixelPlatterPack.foodVariants) {
      expect(variant.spriteKey).toBe(foodVariantToSpriteKey(variant.variantId));
      expect(variant.spriteKey.startsWith(`${DEFAULT_FOOD_SPRITE_KEY}.`)).toBe(true);
    }
  });
});
