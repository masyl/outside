import { DEFAULT_FOOD_SPRITE_KEY } from '@outside/resource-packs/pixel-platter/meta';
import type { Texture } from 'pixi.js';

/**
 * Resolves food texture by sprite key with deterministic fallback.
 *
 * Order: variant key -> default food key -> null (caller uses error placeholder).
 */
export function resolveFoodTexture(
  textureMap: Map<string, Texture>,
  spriteKey: string | null
): Texture | null {
  if (spriteKey) {
    const exact = textureMap.get(spriteKey);
    if (exact) return exact;
  }

  const fallback = textureMap.get(DEFAULT_FOOD_SPRITE_KEY);
  return fallback ?? null;
}
