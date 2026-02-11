/**
 * Configure tic duration (e.g. 50 ms). Parent controls simulation rate.
 * @packageDocumentation
 */

import type { Physics3dRuntimeMode, SimulatorWorld } from './world';
import {
  setExternalSystemScriptFailurePolicy,
  type ExternalSystemScriptFailurePolicy,
} from './system-script-hooks';
import { setCommandScriptFailurePolicy, type CommandScriptFailurePolicy } from './command-scripts';
import { setEventScriptFailurePolicy, type EventScriptFailurePolicy } from './event-scripts';

/**
 * Sets the tic duration in milliseconds. Used for movement distance per tic.
 *
 * @param world - Simulator world
 * @param ticDurationMs - Duration of one tic in ms
 */
export function configureTicDurationMs(
  world: SimulatorWorld,
  ticDurationMs: number
): void {
  world.ticDurationMs = ticDurationMs;
}

/**
 * Sets physics3d execution runtime.
 *
 * @param world - Simulator world
 * @param runtimeMode - Runtime mode ('lua' | 'ts')
 */
export function configurePhysics3dRuntimeMode(
  world: SimulatorWorld,
  runtimeMode: Physics3dRuntimeMode
): void {
  world.physics3dRuntimeMode = runtimeMode;
}

/**
 * Sets the failure policy for external system scripts.
 *
 * @param world - Simulator world
 * @param policy - Script failure policy
 */
export function configureExternalSystemScriptFailurePolicy(
  world: SimulatorWorld,
  policy: ExternalSystemScriptFailurePolicy
): void {
  setExternalSystemScriptFailurePolicy(world, policy);
}

/**
 * Sets the failure policy for queued command scripts.
 *
 * @param world - Simulator world
 * @param policy - Script failure policy
 */
export function configureCommandScriptFailurePolicy(
  world: SimulatorWorld,
  policy: CommandScriptFailurePolicy
): void {
  setCommandScriptFailurePolicy(world, policy);
}

/**
 * Sets the failure policy for event scripts.
 *
 * @param world - Simulator world
 * @param policy - Script failure policy
 */
export function configureEventScriptFailurePolicy(
  world: SimulatorWorld,
  policy: EventScriptFailurePolicy
): void {
  setEventScriptFailurePolicy(world, policy);
}
