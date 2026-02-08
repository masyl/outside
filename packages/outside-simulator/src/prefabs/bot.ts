/**
 * Default bot entity prefab: movable entity with Position, Size, Direction, Speed, MaxSpeed.
 * Wander/WanderPersistence are added per-entity in spawnBot so urge state is not shared via prefab.
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
  VisualSize,
  ObstacleSize,
  Size,
  Obstacle,
  Direction,
  Speed,
  Wander,
  WanderPersistence,
  Wait,
  Follow,
  FollowTarget,
  FollowTightness,
  MaxSpeed,
  PointerTarget,
  Observed,
} from '../components';
import type { SimulatorWorld } from '../world';

const prefabByWorld = new WeakMap<SimulatorWorld, number>();

/** Default bot values (overridable at spawn). Visual 1.2 tiles, obstacle 0.8 tiles; speeds 2× for snappier demo. */
const DEFAULTS = {
  x: 0,
  y: 0,
  visualDiameter: 1.2,
  obstacleDiameter: 0.8,
  directionRad: 0,
  tilesPerSec: 1,
  maxSpeedTps: 4,
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
  addComponent(world, prefabEid, Observed);
  addComponent(world, prefabEid, set(Position, { x: DEFAULTS.x, y: DEFAULTS.y }));
  addComponent(world, prefabEid, set(VisualSize, { diameter: DEFAULTS.visualDiameter }));
  addComponent(world, prefabEid, set(ObstacleSize, { diameter: DEFAULTS.obstacleDiameter }));
  addComponent(world, prefabEid, set(Size, { diameter: DEFAULTS.obstacleDiameter }));
  addComponent(world, prefabEid, Obstacle);
  addComponent(world, prefabEid, set(Direction, { angle: DEFAULTS.directionRad }));
  addComponent(world, prefabEid, set(Speed, { tilesPerSec: DEFAULTS.tilesPerSec }));
  addComponent(world, prefabEid, set(MaxSpeed, { tilesPerSec: DEFAULTS.maxSpeedTps }));
  addComponent(world, prefabEid, PointerTarget);
  // Wander + WanderPersistence are added per-entity in spawnBot so each bot has its own slot (no prefab inheritance for urge state)

  prefabByWorld.set(world, prefabEid);
  return prefabEid;
}

export interface SpawnBotOptions {
  x?: number;
  y?: number;
  /** If set, overrides both visualDiameter and obstacleDiameter (for tests / backward compat). */
  diameter?: number;
  /** Visual diameter in tiles (rendering). Default 1.2. */
  visualDiameter?: number;
  /** Obstacle diameter in tiles (collision). Default 0.8. */
  obstacleDiameter?: number;
  directionRad?: number;
  tilesPerSec?: number;
  /** Urge: wait (no move), wander (random walk), follow (steer toward target), or none (keep initial dir/speed). Default: wander. */
  urge?: 'wait' | 'wander' | 'follow' | 'none';
  /** Target entity id for follow urge. Required when urge === 'follow'. */
  followTargetEid?: number;
  /** Follow tightness (0 = instant, higher = slower adjustment). Optional. */
  followTightness?: number;
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
  addComponent(world, eid, Observed);

  if (options?.x !== undefined || options?.y !== undefined) {
    setComponent(world, eid, Position, {
      x: options.x ?? DEFAULTS.x,
      y: options.y ?? DEFAULTS.y,
    });
  }
  if (options?.diameter !== undefined) {
    setComponent(world, eid, VisualSize, { diameter: options.diameter });
    setComponent(world, eid, ObstacleSize, { diameter: options.diameter });
    setComponent(world, eid, Size, { diameter: options.diameter });
  } else {
    if (options?.visualDiameter !== undefined) {
      setComponent(world, eid, VisualSize, { diameter: options.visualDiameter });
    }
    if (options?.obstacleDiameter !== undefined) {
      setComponent(world, eid, ObstacleSize, { diameter: options.obstacleDiameter });
      setComponent(world, eid, Size, { diameter: options.obstacleDiameter });
    }
  }
  if (options?.directionRad !== undefined) {
    setComponent(world, eid, Direction, { angle: options.directionRad });
  }
  if (options?.tilesPerSec !== undefined) {
    setComponent(world, eid, Speed, { tilesPerSec: options.tilesPerSec });
  }

  const urge = options?.urge ?? 'wander';
  if (urge === 'follow' && options?.followTargetEid != null) {
    addComponent(world, eid, Follow);
    addComponent(world, eid, FollowTarget);
    FollowTarget.eid[eid] = options.followTargetEid;
    if (options?.followTightness != null) {
      addComponent(world, eid, FollowTightness);
      FollowTightness.value[eid] = options.followTightness;
    }
  } else if (urge === 'wait') {
    addComponent(world, eid, Wait);
  } else if (urge === 'none') {
    // no urge: entity keeps initial Direction/Speed (deterministic movement)
  } else {
    // wander (default): add per-entity so each bot has its own WanderPersistence slot; urge system reads/writes array[eid]
    addComponent(world, eid, Wander);
    addComponent(world, eid, WanderPersistence);
    WanderPersistence.ticsUntilNextChange[eid] = 0;
  }

  return eid;
}
