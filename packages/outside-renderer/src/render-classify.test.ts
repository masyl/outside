import { describe, it, expect } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { DefaultSpriteKey, VariantSpriteKey } from '@outside/simulator';
import { createRenderWorld } from './render-world';
import { classifyRenderKind, resolveSpriteKey } from './render-classify';

function makeWorld() {
  return createRenderWorld().world;
}

describe('classifyRenderKind', () => {
  it('classifies known sprite keys', () => {
    const world = makeWorld();
    const entries = [
      ['tile.floor', 'floor'],
      ['tile.wall', 'wall'],
      ['actor.bot', 'bot'],
      ['actor.hero', 'hero'],
      ['pickup.food', 'food'],
    ] as const;

    for (const [key, expected] of entries) {
      const eid = addEntity(world);
      addComponent(world, eid, DefaultSpriteKey);
      DefaultSpriteKey.value[eid] = key;
      expect(classifyRenderKind(world, eid)).toBe(expected);
    }
  });

  it('uses variant key before default key', () => {
    const world = makeWorld();
    const eid = addEntity(world);
    addComponent(world, eid, DefaultSpriteKey);
    DefaultSpriteKey.value[eid] = 'actor.bot';
    addComponent(world, eid, VariantSpriteKey);
    VariantSpriteKey.value[eid] = 'pickup.food';
    expect(resolveSpriteKey(world, eid)).toBe('pickup.food');
    expect(classifyRenderKind(world, eid)).toBe('food');
  });

  it('falls back to error when no known key exists', () => {
    const world = makeWorld();
    const missing = addEntity(world);
    expect(classifyRenderKind(world, missing)).toBe('error');

    const unknown = addEntity(world);
    addComponent(world, unknown, DefaultSpriteKey);
    DefaultSpriteKey.value[unknown] = 'unknown.key';
    expect(classifyRenderKind(world, unknown)).toBe('error');
  });
});
