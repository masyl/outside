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

export type SimulatorEvent = CollisionEvent | ConsumedEvent;
