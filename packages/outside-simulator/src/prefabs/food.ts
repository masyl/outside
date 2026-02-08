/**
 * Food spawning: static consumable pickups with Position and Size (overlap radius).
 * @packageDocumentation
 */

import { addEntity, addComponent, setComponent } from 'bitecs';
import {
  DEFAULT_FOOD_SPRITE_KEY,
  foodVariantToSpriteKey,
  type FoodVariantId,
} from '@outside/resource-packs/pixel-platter/meta';
import {
  Position,
  Size,
  Food,
  Observed,
  DefaultSpriteKey,
  VariantSpriteKey,
} from '../components';
import type { SimulatorWorld } from '../world';

/** Default food diameter in tiles (used for overlap and rendering). */
const FOOD_DIAMETER = 1;

export interface SpawnFoodOptions {
  x: number;
  y: number;
  variant?: FoodVariantId;
}

/**
 * Spawns a food entity at (x, y). Position is center; Size defines overlap radius.
 * No Obstacle — food is walk-through; consumption happens on overlap.
 *
 * @param world - Simulator world
 * @param options - { x, y } world position (center)
 * @returns New entity id
 */
export function spawnFood(
  world: SimulatorWorld,
  options: SpawnFoodOptions
): number {
  const { x, y, variant } = options;
  const eid = addEntity(world);
  addComponent(world, eid, Observed);
  addComponent(world, eid, Position);
  setComponent(world, eid, Position, { x, y });
  addComponent(world, eid, Size);
  setComponent(world, eid, Size, { diameter: FOOD_DIAMETER });
  addComponent(world, eid, Food);
  addComponent(world, eid, DefaultSpriteKey);
  setComponent(world, eid, DefaultSpriteKey, { value: DEFAULT_FOOD_SPRITE_KEY });
  addComponent(world, eid, VariantSpriteKey);
  setComponent(world, eid, VariantSpriteKey, {
    value: variant ? foodVariantToSpriteKey(variant) : '',
  });
  return eid;
}
