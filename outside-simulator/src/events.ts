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

export type SimulatorEvent = CollisionEvent;
