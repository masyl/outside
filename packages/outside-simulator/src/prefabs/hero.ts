/**
 * Hero entity prefab: player-controlled character. Same movement components as bot
 * but no Wander, Follow, or Wait. Movement is driven only by the hero path system.
 * Visual: 100% white (renderer interprets via Hero tag).
 *
 * @packageDocumentation
 */

import { addPrefab, addEntity, addComponent, set, IsA, setComponent } from 'bitecs';
import {
  Position,
  VisualSize,
  ObstacleSize,
  Size,
  Obstacle,
  Direction,
  Speed,
  MaxSpeed,
  PointerTarget,
  Hero,
} from '../components';
import type { SimulatorWorld } from '../world';

const prefabByWorld = new WeakMap<SimulatorWorld, number>();

const DEFAULTS = {
  x: 0,
  y: 0,
  visualDiameter: 1.2,
  obstacleDiameter: 0.8,
  directionRad: 0,
  tilesPerSec: 0,
  maxSpeedTps: 6,
} as const;

/**
 * Returns the hero prefab entity id for the world, creating it on first call.
 */
export function getOrCreateHeroPrefab(world: SimulatorWorld): number {
  let prefabEid = prefabByWorld.get(world);
  if (prefabEid !== undefined) return prefabEid;

  prefabEid = addPrefab(world);
  addComponent(world, prefabEid, set(Position, { x: DEFAULTS.x, y: DEFAULTS.y }));
  addComponent(world, prefabEid, set(VisualSize, { diameter: DEFAULTS.visualDiameter }));
  addComponent(world, prefabEid, set(ObstacleSize, { diameter: DEFAULTS.obstacleDiameter }));
  addComponent(world, prefabEid, set(Size, { diameter: DEFAULTS.obstacleDiameter }));
  addComponent(world, prefabEid, Obstacle);
  addComponent(world, prefabEid, set(Direction, { angle: DEFAULTS.directionRad }));
  addComponent(world, prefabEid, set(Speed, { tilesPerSec: DEFAULTS.tilesPerSec }));
  addComponent(world, prefabEid, set(MaxSpeed, { tilesPerSec: DEFAULTS.maxSpeedTps }));
  addComponent(world, prefabEid, PointerTarget);
  addComponent(world, prefabEid, Hero);

  prefabByWorld.set(world, prefabEid);
  return prefabEid;
}

export interface SpawnHeroOptions {
  x?: number;
  y?: number;
}

/**
 * Spawns a hero entity. Hero has no autonomous urge; movement is only via path-follow.
 *
 * @param world - Simulator world
 * @param options - Optional position (default 0,0)
 * @returns New entity id
 */
export function spawnHero(
  world: SimulatorWorld,
  options?: SpawnHeroOptions
): number {
  const prefabEid = getOrCreateHeroPrefab(world);
  const eid = addEntity(world);
  addComponent(world, eid, IsA(prefabEid));

  if (options?.x !== undefined || options?.y !== undefined) {
    setComponent(world, eid, Position, {
      x: options.x ?? DEFAULTS.x,
      y: options.y ?? DEFAULTS.y,
    });
  }

  return eid;
}
