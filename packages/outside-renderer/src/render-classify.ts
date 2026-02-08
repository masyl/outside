import { hasComponent } from 'bitecs';
import {
  DefaultSpriteKey,
  VariantSpriteKey,
} from '@outside/simulator';
import type { RenderWorldState } from './render-world';

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

export function classifyRenderKind(world: RenderWorldState['world'], eid: number): RenderKind {
  const spriteKey = resolveSpriteKey(world, eid);
  if (!spriteKey) return 'error';
  return SPRITE_KEY_TO_RENDER_KIND[spriteKey] ?? 'error';
}
