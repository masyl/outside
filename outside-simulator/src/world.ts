/**
 * World creation and simulator state.
 * @packageDocumentation
 */

import type { World } from 'bitecs';
import { createWorld as bitecsCreateWorld } from 'bitecs';
import { Random } from '@outside/utils';
import type { SimulatorEvent } from './events';
import { registerPipelineObservers } from './observers';
import { addDefaultGrids } from './world-defaults';

/** Default tic duration in milliseconds (e.g. 50 ms) */
export const DEFAULT_TIC_DURATION_MS = 50;

/**
 * Extended world state: ECS world plus event queue, tic config, tic count, and RNG.
 */
export interface SimulatorWorld extends World<{
  eventQueue: SimulatorEvent[];
  ticDurationMs: number;
  ticCount: number;
  seed: number;
  random: Random;
}> {
  eventQueue: SimulatorEvent[];
  ticDurationMs: number;
  ticCount: number;
  seed: number;
  random: Random;
}

/**
 * Options when creating a simulator world.
 */
export interface CreateWorldOptions {
  /** Tic duration in milliseconds (default: 50) */
  ticDurationMs?: number;
  /** Master seed for deterministic simulation (default: random) */
  seed?: number;
}

/**
 * Creates a new simulator world with default config.
 *
 * @param options - Optional tic duration and seed
 * @returns New simulator world
 */
export function createWorld(options?: CreateWorldOptions): SimulatorWorld {
  const seed = options?.seed ?? Math.floor(Math.random() * 2147483647);
  const world = bitecsCreateWorld({
    eventQueue: [] as SimulatorEvent[],
    ticDurationMs: options?.ticDurationMs ?? DEFAULT_TIC_DURATION_MS,
    ticCount: 0,
    seed,
    random: new Random(seed),
  }) as SimulatorWorld;
  registerPipelineObservers(world);
  addDefaultGrids(world);
  return world;
}
