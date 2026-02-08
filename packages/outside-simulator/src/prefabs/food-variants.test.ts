import { describe, expect, it } from 'vitest';
import { hasComponent, query } from 'bitecs';
import { createWorld } from '../world';
import { DefaultSpriteKey, Food, Position, Size, VariantSpriteKey } from '../components';
import { spawnFood } from './food';
import { spawnFoodByVariant } from './food-variants';

describe('food variants', () => {
  it('spawnFood should set variant sprite key when variant is provided', () => {
    const world = createWorld({ seed: 1, ticDurationMs: 50 });
    const eid = spawnFood(world, { x: 2, y: 3, variant: 'apple' });

    expect(hasComponent(world, eid, Food)).toBe(true);
    expect(DefaultSpriteKey.value[eid]).toBe('pickup.food');
    expect(VariantSpriteKey.value[eid]).toBe('pickup.food.apple');
    expect(Position.x[eid]).toBe(2);
    expect(Position.y[eid]).toBe(3);
    expect(Size.diameter[eid]).toBe(1);
  });

  it('variant helper should spawn expected sprite key and preserve food components', () => {
    const world = createWorld({ seed: 2, ticDurationMs: 50 });
    const eid = spawnFoodByVariant['hotdog-mustard'](world, { x: -1, y: 5 });

    expect(DefaultSpriteKey.value[eid]).toBe('pickup.food');
    expect(VariantSpriteKey.value[eid]).toBe('pickup.food.hotdog-mustard');

    const foodEntities = query(world, [Food, Position, Size]);
    expect(foodEntities.includes(eid)).toBe(true);
  });
});
