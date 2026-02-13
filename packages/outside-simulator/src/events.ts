/**
 * Event types emitted by the simulation (e.g. collisions).
 * Events are written to a queue during runTics(); parent drains between calls.
 * @packageDocumentation
 */

/**
 * Collision event: two entities overlapped this tic.
 */
export interface CollisionEvent {
  type: 'collision';
  entityA: number;
  entityB: number;
}

/**
 * Consumed event: a bot overlapped a food entity; food was removed.
 */
export interface ConsumedEvent {
  type: 'consumed';
  entity: number;
  foodEntity: number;
  x: number;
  y: number;
}

/**
 * Food loaded into canon: a bot with a FoodCanon walked over a food entity.
 * The food is hidden (not deleted) and linked to the canon.
 */
export interface FoodLoadedInCanonEvent {
  type: 'food_loaded_in_canon';
  canonEntity: number;
  foodEntity: number;
}

/**
 * Projectile fired: a canon entity spawned a food projectile.
 */
export interface ProjectileFiredEvent {
  type: 'projectile_fired';
  shooterEntity: number;
  projectileEntity: number;
  foodEntity: number;
}

export type SimulatorEvent = CollisionEvent | ConsumedEvent | FoodLoadedInCanonEvent | ProjectileFiredEvent;
