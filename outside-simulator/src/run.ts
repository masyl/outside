/**
 * Run simulation tics: urge → movement → consumption → obstacleCollision → collision (fixed order).
 * @packageDocumentation
 */

import { urgeSystem } from './systems/urge';
import { movementSystem } from './systems/movement';
import { consumptionSystem } from './systems/consumption';
import { obstacleCollisionSystem } from './systems/obstacleCollision';
import { collisionSystem } from './systems/collision';
import type { SimulatorWorld } from './world';

const pipeline = (world: SimulatorWorld) => {
  world.ticCount = (world.ticCount ?? 0) + 1;
  urgeSystem(world);
  movementSystem(world);
  consumptionSystem(world);
  obstacleCollisionSystem(world);
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
