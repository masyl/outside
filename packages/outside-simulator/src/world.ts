/**
 * World creation and simulator state.
 * @packageDocumentation
 */

import type { World } from 'bitecs';
import { createWorld as bitecsCreateWorld } from 'bitecs';
import { Random } from '@outside/utils';
import type { SimulatorEvent } from './events';
import type {
  Physics3dPhaseId,
  Physics3dState,
  Physics3dTuning,
} from './systems/physics3d';
import { registerPipelineObservers } from './observers';
import { addDefaultGrids, addViewEntity, addPointerEntity } from './world-defaults';

/** Default tic duration in milliseconds (e.g. 50 ms) */
export const DEFAULT_TIC_DURATION_MS = 50;
export type Physics3dRuntimeMode = 'lua' | 'ts';
export interface Physics3dRuntimeMetrics {
  lastTicTotalMs: number;
  totalMs: number;
  lastTicMsByPhase: Partial<Record<Physics3dPhaseId, number>>;
  totalMsByPhase: Partial<Record<Physics3dPhaseId, number>>;
  ticCountMeasured: number;
}

/**
 * Extended world state: ECS world plus event queue, tic config, tic count, and RNG.
 */
export interface SimulatorWorld extends World<{
  eventQueue: SimulatorEvent[];
  ticDurationMs: number;
  ticCount: number;
  seed: number;
  random: Random;
  physics3dRuntimeMode: Physics3dRuntimeMode;
  physics3dRuntimeMetrics: Physics3dRuntimeMetrics;
  physics3dState?: Physics3dState;
  physics3dTuning?: Partial<Physics3dTuning>;
}> {
  eventQueue: SimulatorEvent[];
  ticDurationMs: number;
  ticCount: number;
  seed: number;
  random: Random;
  physics3dRuntimeMode: Physics3dRuntimeMode;
  physics3dRuntimeMetrics: Physics3dRuntimeMetrics;
  physics3dState?: Physics3dState;
  physics3dTuning?: Partial<Physics3dTuning>;
}

/**
 * Options when creating a simulator world.
 */
export interface CreateWorldOptions {
  /** Tic duration in milliseconds (default: 50) */
  ticDurationMs?: number;
  /** Master seed for deterministic simulation (default: random) */
  seed?: number;
  /** Physics3d execution runtime (default: lua) */
  physics3dRuntimeMode?: Physics3dRuntimeMode;
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
    physics3dRuntimeMode: options?.physics3dRuntimeMode ?? 'lua',
    physics3dRuntimeMetrics: {
      lastTicTotalMs: 0,
      totalMs: 0,
      lastTicMsByPhase: {},
      totalMsByPhase: {},
      ticCountMeasured: 0,
    },
    physics3dState: undefined,
    physics3dTuning: undefined,
  }) as SimulatorWorld;
  registerPipelineObservers(world);
  addDefaultGrids(world);
  addViewEntity(world);
  addPointerEntity(world);
  return world;
}
