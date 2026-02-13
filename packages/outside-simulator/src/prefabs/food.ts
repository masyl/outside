/**
 * Food spawning: static consumable pickups with Position and Size (overlap radius).
 * Also attaches projectile physics parameters (ProjectileMass, Bounciness, ShotCount)
 * so the canon system can read them when the food is loaded into a canon.
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
  Bounciness,
  ProjectileMass,
  ShotCount,
} from '../components';
import { FOOD_PROJECTILE_PARAMS } from '../food-projectile-params';
import type { SimulatorWorld } from '../world';

/** Default food diameter in tiles (used for overlap and rendering). */
const FOOD_DIAMETER = 1;

/** Fallback params for unknown variants. */
const DEFAULT_PROJECTILE_PARAMS = FOOD_PROJECTILE_PARAMS['apple'];

export interface SpawnFoodOptions {
  x: number;
  y: number;
  variant?: FoodVariantId;
}

/**
 * Spawns a food entity at (x, y). Position is center; Size defines overlap radius.
 * No Obstacle — food is walk-through; consumption happens on overlap.
 * Attaches ProjectileMass, Bounciness, and ShotCount for use by the canon system.
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
  const params = variant ? (FOOD_PROJECTILE_PARAMS[variant] ?? DEFAULT_PROJECTILE_PARAMS) : DEFAULT_PROJECTILE_PARAMS;

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

  // Projectile physics parameters — read by the canon system at fire time.
  addComponent(world, eid, ProjectileMass);
  setComponent(world, eid, ProjectileMass, { value: params.mass });
  addComponent(world, eid, Bounciness);
  setComponent(world, eid, Bounciness, { value: params.bounciness });
  addComponent(world, eid, ShotCount);
  setComponent(world, eid, ShotCount, { max: params.shotCount, remaining: params.shotCount });

  return eid;
}
