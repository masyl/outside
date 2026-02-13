/**
 * Per-food-variant physics parameters used when the food is fired as a projectile.
 * mass: affects inertia and impulse magnitude.
 * bounciness: [0..1] restitution.
 * obstacleDiameter: collision radius in tiles.
 * shotCount: number of shots before the food teleports back to the dungeon.
 * launchSpeed: tiles per second at launch.
 * @packageDocumentation
 */

import type { FoodVariantId } from '@outside/resource-packs/pixel-platter/meta';

export interface FoodProjectileParams {
  mass: number;
  bounciness: number;
  obstacleDiameter: number;
  shotCount: number;
  launchSpeed: number;
}

export const FOOD_PROJECTILE_PARAMS: Record<FoodVariantId, FoodProjectileParams> = {
  // Fast, light fruits — many shots
  cherry:        { mass: 0.05, bounciness: 0.85, obstacleDiameter: 0.3, shotCount: 12, launchSpeed: 16 },
  raspberry:     { mass: 0.06, bounciness: 0.80, obstacleDiameter: 0.3, shotCount: 12, launchSpeed: 15 },
  grapes:        { mass: 0.12, bounciness: 0.70, obstacleDiameter: 0.4, shotCount: 10, launchSpeed: 14 },
  strawberry:    { mass: 0.08, bounciness: 0.75, obstacleDiameter: 0.35, shotCount: 10, launchSpeed: 15 },
  kiwi:          { mass: 0.09, bounciness: 0.65, obstacleDiameter: 0.4, shotCount: 8,  launchSpeed: 13 },
  lemon:         { mass: 0.11, bounciness: 0.60, obstacleDiameter: 0.4, shotCount: 8,  launchSpeed: 13 },
  // Medium fruits
  orange:        { mass: 0.18, bounciness: 0.55, obstacleDiameter: 0.5, shotCount: 6,  launchSpeed: 12 },
  apple:         { mass: 0.18, bounciness: 0.50, obstacleDiameter: 0.5, shotCount: 6,  launchSpeed: 12 },
  pear:          { mass: 0.17, bounciness: 0.48, obstacleDiameter: 0.5, shotCount: 6,  launchSpeed: 12 },
  banana:        { mass: 0.14, bounciness: 0.30, obstacleDiameter: 0.5, shotCount: 5,  launchSpeed: 11 },
  // Fast junk food — splashy
  'french-fries':       { mass: 0.08, bounciness: 0.20, obstacleDiameter: 0.4, shotCount: 8,  launchSpeed: 14 },
  hotdog:               { mass: 0.15, bounciness: 0.25, obstacleDiameter: 0.45, shotCount: 6, launchSpeed: 12 },
  'hotdog-mustard':     { mass: 0.16, bounciness: 0.22, obstacleDiameter: 0.45, shotCount: 5, launchSpeed: 11 },
  soda:                 { mass: 0.35, bounciness: 0.40, obstacleDiameter: 0.45, shotCount: 4, launchSpeed: 13 },
  'pizza-slice':        { mass: 0.22, bounciness: 0.15, obstacleDiameter: 0.55, shotCount: 4, launchSpeed: 10 },
  burger:               { mass: 0.45, bounciness: 0.10, obstacleDiameter: 0.65, shotCount: 2, launchSpeed: 9  },
  // Desserts — slow, heavy, few shots
  macarons:             { mass: 0.10, bounciness: 0.50, obstacleDiameter: 0.35, shotCount: 8,  launchSpeed: 13 },
  tiramisu:             { mass: 0.30, bounciness: 0.08, obstacleDiameter: 0.55, shotCount: 3,  launchSpeed: 9  },
  'creme-brulee':       { mass: 0.28, bounciness: 0.12, obstacleDiameter: 0.50, shotCount: 3,  launchSpeed: 10 },
  'ice-cream-sandwich': { mass: 0.20, bounciness: 0.18, obstacleDiameter: 0.50, shotCount: 4,  launchSpeed: 10 },
  'pumpkin-pie-slice':  { mass: 0.32, bounciness: 0.10, obstacleDiameter: 0.60, shotCount: 3,  launchSpeed: 9  },
  'red-velvet-cake-slice': { mass: 0.38, bounciness: 0.08, obstacleDiameter: 0.60, shotCount: 2, launchSpeed: 8 },
};
