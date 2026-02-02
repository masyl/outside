/**
 * Configure tic duration (e.g. 50 ms). Parent controls simulation rate.
 * @packageDocumentation
 */

import type { SimulatorWorld } from './world';

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
