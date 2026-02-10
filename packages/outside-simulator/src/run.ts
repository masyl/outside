/**
 * Run simulation tics with the unified physics pipeline.
 * @packageDocumentation
 */

import { pathFollowingSystem } from './path-following';
import { urgeSystem } from './systems/urge';
import { paceSystem } from './systems/pace';
import { consumptionSystem } from './systems/consumption';
import { physics3dSystem } from './systems/physics3d';
import type { SimulatorWorld } from './world';

const physicsPipeline = (world: SimulatorWorld) => {
  world.ticCount = (world.ticCount ?? 0) + 1;
  pathFollowingSystem(world);
  urgeSystem(world);
  paceSystem(world);
  physics3dSystem(world);
  consumptionSystem(world);
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
    physicsPipeline(world);
  }
  return world;
}
