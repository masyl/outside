/**
 * Run simulation tics: movement → collision → randomWalk (fixed order).
 * Observer setup (withStore) for getComponent/setComponent is colocated here.
 * @packageDocumentation
 */

import { observe, onGet, onSet } from 'bitecs';
import { Position, Size, Direction, Speed } from './components';
import { movementSystem } from './systems/movement';
import { collisionSystem } from './systems/collision';
import { randomWalkSystem } from './systems/randomWalk';
import type { SimulatorWorld } from './world';

/** SoA component shape: record of number arrays keyed by property name. */
type SoAComponent = Record<string, number[]>;

/**
 * Registers onSet and onGet observers for a component so getComponent/setComponent
 * read/write the SoA arrays (bitecs Prefabs recommended pattern).
 */
function withStore(
  world: SimulatorWorld,
  component: SoAComponent
): void {
  observe(world, onSet(component), (eid: number, params: Record<string, number>) => {
    for (const key in params) {
      component[key][eid] = params[key];
    }
  });
  observe(world, onGet(component), (eid: number) => {
    const result: Record<string, number> = {};
    for (const key in component) {
      result[key] = component[key][eid];
    }
    return result;
  });
}

/**
 * Registers observers for all pipeline components (Position, Size, Direction, Speed).
 * Called from createWorld so getComponent/setComponent and IsA inheritance work.
 */
export function registerPipelineObservers(world: SimulatorWorld): void {
  withStore(world, Position);
  withStore(world, Size);
  withStore(world, Direction);
  withStore(world, Speed);
}

const pipeline = (world: SimulatorWorld) => {
  movementSystem(world);
  collisionSystem(world);
  randomWalkSystem(world);
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
