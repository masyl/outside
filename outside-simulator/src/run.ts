/**
 * Run simulation tics: urge → movement → collision (fixed order).
 * @packageDocumentation
 */

import { urgeSystem } from './systems/urge';
import { movementSystem } from './systems/movement';
import { collisionSystem } from './systems/collision';
import type { SimulatorWorld } from './world';

const pipeline = (world: SimulatorWorld) => {
  urgeSystem(world);
  movementSystem(world);
  collisionSystem(world);
  return world;
};

/**
 * Runs N simulation tics. Events (e.g. collisions) are appended to the world's event queue.
 * Parent should drain the queue between calls.
 *
 * @param world - Simulator world
 * @param n - Number of tics to run
 * @returns The world (for chaining)
 */
export function runTics(world: SimulatorWorld, n: number): SimulatorWorld {
  for (let i = 0; i < n; i++) {
    pipeline(world);
  }
  return world;
}
