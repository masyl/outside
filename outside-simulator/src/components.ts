/**
 * ECS component definitions for the simulation.
 * bitecs 0.4: plain SoA objects (structure of arrays).
 * @packageDocumentation
 */

/** Position in world space (tiles) */
export const Position = {
  x: [] as number[],
  y: [] as number[],
};

/** Size: diameter in tiles (used for collision) */
export const Size = {
  diameter: [] as number[],
};

/** Direction in radians (0 = right, π/2 = down) */
export const Direction = {
  angle: [] as number[],
};

/** Speed in tiles per second */
export const Speed = {
  tilesPerSec: [] as number[],
};

/** Tag for entities that participate in randomWalk behavior */
export const RandomWalk = {};

/**
 * Tag for entities to be tracked by the Observer serializer.
 * Add this component to entities you want to observe (add/remove) for
 * createObserverSerializer(world, Observed, components).
 */
export const Observed = {};
