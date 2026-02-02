/**
 * World creation and simulator state.
 * @packageDocumentation
 */

import type { World } from 'bitecs';
import { createWorld as bitecsCreateWorld, addEntity, addComponent } from 'bitecs';
import { Random } from '@outside/utils';
import {
  Position,
  Size,
  Direction,
  Speed,
  RandomWalk,
} from './components';
import type { SimulatorEvent } from './events';
import { registerPipelineObservers } from './observers';

/** Default tic duration in milliseconds (e.g. 50 ms) */
export const DEFAULT_TIC_DURATION_MS = 50;

/**
 * Extended world state: ECS world plus event queue, tic config, and RNG.
 */
export interface SimulatorWorld extends World<{
  eventQueue: SimulatorEvent[];
  ticDurationMs: number;
  seed: number;
  random: Random;
}> {
  eventQueue: SimulatorEvent[];
  ticDurationMs: number;
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
    seed,
    random: new Random(seed),
  }) as SimulatorWorld;
  registerPipelineObservers(world);
  return world;
}

/**
 * Adds a new entity to the world and returns its id.
 *
 * @param world - Simulator world
 * @returns Entity id (eid)
 */
export function addSimEntity(world: SimulatorWorld): number {
  return addEntity(world);
}

/**
 * Adds position, size, direction, and speed components to an entity.
 * Used when spawning a movable entity.
 *
 * @param world - Simulator world
 * @param eid - Entity id
 * @param x - Initial x position
 * @param y - Initial y position
 * @param diameter - Collision diameter
 * @param directionRad - Initial direction in radians
 * @param tilesPerSec - Speed in tiles per second
 */
export function addMovementComponents(
  world: SimulatorWorld,
  eid: number,
  x: number,
  y: number,
  diameter: number,
  directionRad: number,
  tilesPerSec: number
): void {
  addComponent(world, eid, Position);
  addComponent(world, eid, Size);
  addComponent(world, eid, Direction);
  addComponent(world, eid, Speed);
  Position.x[eid] = x;
  Position.y[eid] = y;
  Size.diameter[eid] = diameter;
  Direction.angle[eid] = directionRad;
  Speed.tilesPerSec[eid] = tilesPerSec;
}

/**
 * Adds the RandomWalk tag to an entity (must already have movement components).
 *
 * @param world - Simulator world
 * @param eid - Entity id
 */
export function addRandomWalk(world: SimulatorWorld, eid: number): void {
  addComponent(world, eid, RandomWalk);
}
