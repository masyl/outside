/**
 * Pixel Platter food-variant helpers built on top of `spawnFood`.
 * @packageDocumentation
 */

import { foodVariantIds, type FoodVariantId } from '@outside/resource-packs/pixel-platter/meta';
import type { SimulatorWorld } from '../world';
import { spawnFood, type SpawnFoodOptions } from './food';

/** Spawn options without the variant (variant is provided by helper). */
export type SpawnFoodVariantOptions = Omit<SpawnFoodOptions, 'variant'>;

/** Canonical list of supported food variants. */
export const FOOD_VARIANTS = [...foodVariantIds];

/** Spawns food with an explicit Pixel Platter variant id. */
export function spawnFoodVariant(
  world: SimulatorWorld,
  variant: FoodVariantId,
  options: SpawnFoodVariantOptions
): number {
  return spawnFood(world, {
    ...options,
    variant,
  });
}

/**
 * Variant-specific spawners indexed by variant id.
 * Each function delegates to `spawnFood` with a fixed `variant` value.
 */
export const spawnFoodByVariant: Record<
  FoodVariantId,
  (world: SimulatorWorld, options: SpawnFoodVariantOptions) => number
> = {
  'french-fries': (world, options) => spawnFoodVariant(world, 'french-fries', options),
  burger: (world, options) => spawnFoodVariant(world, 'burger', options),
  soda: (world, options) => spawnFoodVariant(world, 'soda', options),
  'pizza-slice': (world, options) => spawnFoodVariant(world, 'pizza-slice', options),
  hotdog: (world, options) => spawnFoodVariant(world, 'hotdog', options),
  'hotdog-mustard': (world, options) => spawnFoodVariant(world, 'hotdog-mustard', options),
  'pumpkin-pie-slice': (world, options) => spawnFoodVariant(world, 'pumpkin-pie-slice', options),
  macarons: (world, options) => spawnFoodVariant(world, 'macarons', options),
  'red-velvet-cake-slice': (world, options) =>
    spawnFoodVariant(world, 'red-velvet-cake-slice', options),
  tiramisu: (world, options) => spawnFoodVariant(world, 'tiramisu', options),
  'ice-cream-sandwich': (world, options) =>
    spawnFoodVariant(world, 'ice-cream-sandwich', options),
  'creme-brulee': (world, options) => spawnFoodVariant(world, 'creme-brulee', options),
  orange: (world, options) => spawnFoodVariant(world, 'orange', options),
  apple: (world, options) => spawnFoodVariant(world, 'apple', options),
  banana: (world, options) => spawnFoodVariant(world, 'banana', options),
  pear: (world, options) => spawnFoodVariant(world, 'pear', options),
  cherry: (world, options) => spawnFoodVariant(world, 'cherry', options),
  lemon: (world, options) => spawnFoodVariant(world, 'lemon', options),
  grapes: (world, options) => spawnFoodVariant(world, 'grapes', options),
  strawberry: (world, options) => spawnFoodVariant(world, 'strawberry', options),
  raspberry: (world, options) => spawnFoodVariant(world, 'raspberry', options),
  kiwi: (world, options) => spawnFoodVariant(world, 'kiwi', options),
};
