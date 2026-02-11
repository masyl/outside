/**
 * Run simulation tics with the unified physics pipeline.
 * @packageDocumentation
 */

import { pathFollowingSystem } from './path-following';
import { urgeSystem } from './systems/urge';
import { paceSystem } from './systems/pace';
import { pointerSystem } from './systems/pointer';
import { consumptionSystem } from './systems/consumption';
import { runPhysics3dSystemFromCoreScript } from './systems/physics3d-core-script-runtime';
import { physics3dSystem } from './systems/physics3d';
import type { SimulatorWorld } from './world';
import { runExternalSystemHook, type CoreSystemHookTarget } from './system-script-hooks';
import { runQueuedCommandScripts } from './command-scripts';
import { runQueuedEventScripts } from './event-scripts';

function nowMs(): number {
  return Date.now();
}

const physicsPipeline = (world: SimulatorWorld) => {
  world.ticCount = (world.ticCount ?? 0) + 1;
  runExternalSystemHook(world, 'tic:pre');

  runSystemWithHooks(world, 'pointer', () => pointerSystem(world));
  runSystemWithHooks(world, 'pathFollowing', () => pathFollowingSystem(world));
  runSystemWithHooks(world, 'urge', () => urgeSystem(world));
  runSystemWithHooks(world, 'pace', () => paceSystem(world));
  runSystemWithHooks(world, 'physics3d', () => {
    world.physics3dRuntimeMetrics.lastTicMsByPhase = {};
    const physicsStart = nowMs();
    if (world.physics3dRuntimeMode === 'ts') {
      physics3dSystem(world);
    } else {
      runPhysics3dSystemFromCoreScript(world);
    }
    const elapsed = nowMs() - physicsStart;
    world.physics3dRuntimeMetrics.lastTicTotalMs = elapsed;
    world.physics3dRuntimeMetrics.totalMs += elapsed;
    world.physics3dRuntimeMetrics.ticCountMeasured += 1;
  });
  runSystemWithHooks(world, 'consumption', () => consumptionSystem(world));
  runQueuedEventScripts(world);
  runQueuedCommandScripts(world);

  runExternalSystemHook(world, 'tic:post');
  return world;
};

function runSystemWithHooks(
  world: SimulatorWorld,
  systemId: CoreSystemHookTarget,
  runSystem: () => void
): void {
  runExternalSystemHook(world, `${systemId}:pre`);
  runSystem();
  runExternalSystemHook(world, `${systemId}:post`);
}

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
