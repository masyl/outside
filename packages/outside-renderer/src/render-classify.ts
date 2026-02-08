import { hasComponent } from 'bitecs';
import { DEFAULT_FOOD_SPRITE_KEY } from '@outside/resource-packs/pixel-platter/meta';
import {
  DefaultSpriteKey,
  FloorTile,
  Food,
  Hero,
  Obstacle,
  VariantSpriteKey,
} from '@outside/simulator';
import type { RenderWorldState } from './render-world';

/**
 * Render-layer classification used by sprite/layer selection.
 */
export type RenderKind = 'floor' | 'wall' | 'bot' | 'hero' | 'food' | 'error';

const SPRITE_KEY_TO_RENDER_KIND = {
  'tile.floor': 'floor',
  'tile.wall': 'wall',
  'actor.bot': 'bot',
  'actor.hero': 'hero',
  'pickup.food': 'food',
} as const satisfies Record<string, RenderKind>;

function readSpriteKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolves `variantSpriteKey` first, then falls back to `defaultSpriteKey`.
 */
export function resolveSpriteKey(
  world: RenderWorldState['world'],
  eid: number
): string | null {
  const variant = hasComponent(world, eid, VariantSpriteKey)
    ? readSpriteKey(VariantSpriteKey.value[eid])
    : null;
  if (variant) return variant;

  const fallback = hasComponent(world, eid, DefaultSpriteKey)
    ? readSpriteKey(DefaultSpriteKey.value[eid])
    : null;
  return fallback;
}

/**
 * Maps resolved sprite keys to a render kind. Unknown keys map to `error`.
 */
export function classifyRenderKind(world: RenderWorldState['world'], eid: number): RenderKind {
  const spriteKey = resolveSpriteKey(world, eid);
  if (spriteKey) {
    if (spriteKey.startsWith(`${DEFAULT_FOOD_SPRITE_KEY}.`)) {
      return 'food';
    }
    const mapped = (SPRITE_KEY_TO_RENDER_KIND as Record<string, RenderKind>)[spriteKey];
    return mapped ?? 'error';
  }

  // Fallback for partially-populated stream entities: use explicit semantic tags.
  if (hasComponent(world, eid, FloorTile)) {
    return hasComponent(world, eid, Obstacle) ? 'wall' : 'floor';
  }
  if (hasComponent(world, eid, Food)) return 'food';
  if (hasComponent(world, eid, Hero)) return 'hero';

  return 'error';
}
