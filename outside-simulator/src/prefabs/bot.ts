/**
 * Default bot entity prefab: movable entity with Position, Size, Direction, Speed, RandomWalk.
 * Use spawnBot to create instances that inherit prefab defaults; override with options.
 *
 * @packageDocumentation
 */

import {
  addPrefab,
  addEntity,
  addComponent,
  set,
  IsA,
  setComponent,
} from 'bitecs';
import {
  Position,
  Size,
  Direction,
  Speed,
  RandomWalk,
} from '../components';
import type { SimulatorWorld } from '../world';

const prefabByWorld = new WeakMap<SimulatorWorld, number>();

/** Default bot values (overridable at spawn). */
const DEFAULTS = {
  x: 0,
  y: 0,
  diameter: 1.5,
  directionRad: 0,
  tilesPerSec: 0.5,
} as const;

/**
 * Returns the bot prefab entity id for the world, creating it on first call.
 *
 * @param world - Simulator world
 * @returns Prefab entity id
 */
export function getOrCreateBotPrefab(world: SimulatorWorld): number {
  let prefabEid = prefabByWorld.get(world);
  if (prefabEid !== undefined) return prefabEid;

  prefabEid = addPrefab(world);
  addComponent(world, prefabEid, set(Position, { x: DEFAULTS.x, y: DEFAULTS.y }));
  addComponent(world, prefabEid, set(Size, { diameter: DEFAULTS.diameter }));
  addComponent(world, prefabEid, set(Direction, { angle: DEFAULTS.directionRad }));
  addComponent(world, prefabEid, set(Speed, { tilesPerSec: DEFAULTS.tilesPerSec }));
  addComponent(world, prefabEid, RandomWalk);

  prefabByWorld.set(world, prefabEid);
  return prefabEid;
}

export interface SpawnBotOptions {
  x?: number;
  y?: number;
  diameter?: number;
  directionRad?: number;
  tilesPerSec?: number;
}

/**
 * Spawns a bot entity that inherits from the bot prefab. Pass options to override defaults.
 *
 * @param world - Simulator world
 * @param options - Optional overrides for position, size, direction, speed
 * @returns New entity id
 */
export function spawnBot(
  world: SimulatorWorld,
  options?: SpawnBotOptions
): number {
  const prefabEid = getOrCreateBotPrefab(world);
  const eid = addEntity(world);
  addComponent(world, eid, IsA(prefabEid));

  if (options?.x !== undefined || options?.y !== undefined) {
    setComponent(world, eid, Position, {
      x: options.x ?? DEFAULTS.x,
      y: options.y ?? DEFAULTS.y,
    });
  }
  if (options?.diameter !== undefined) {
    setComponent(world, eid, Size, { diameter: options.diameter });
  }
  if (options?.directionRad !== undefined) {
    setComponent(world, eid, Direction, { angle: options.directionRad });
  }
  if (options?.tilesPerSec !== undefined) {
    setComponent(world, eid, Speed, { tilesPerSec: options.tilesPerSec });
  }

  return eid;
}
