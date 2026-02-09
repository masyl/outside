/**
 * Hero path storage and orderHeroTo / getHeroPath API. Path is consumed by hero path system.
 * @packageDocumentation
 */

import {
  addComponent,
  getComponent,
  hasComponent,
  query,
  removeComponent,
  setComponent,
} from 'bitecs';
import {
  Direction,
  Hero,
  Position,
  Speed,
  Wander,
  WanderPersistence,
} from './components';
import { findPath, getPassableTiles, simplifyPath } from './pathfinding';
import type { SimulatorWorld } from './world';

const heroPathsByWorld = new WeakMap<
  SimulatorWorld,
  Map<number, { x: number; y: number }[]>
>();

function getPathMap(world: SimulatorWorld): Map<number, { x: number; y: number }[]> {
  let m = heroPathsByWorld.get(world);
  if (m == null) {
    m = new Map();
    heroPathsByWorld.set(world, m);
  }
  return m;
}

/** Distance to waypoint center below which we consider "reached" (tiles). */
const REACHED_THRESHOLD = 0.35;

/** Hero speed when following path (tiles per second). */
const HERO_PATH_TPS = 6;

function angleToward(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

function enableHeroWander(world: SimulatorWorld, heroEid: number): void {
  if (!hasComponent(world, heroEid, Wander)) {
    addComponent(world, heroEid, Wander);
  }
  if (!hasComponent(world, heroEid, WanderPersistence)) {
    addComponent(world, heroEid, WanderPersistence);
  }
  WanderPersistence.ticsUntilNextChange[heroEid] = 0;
  WanderPersistence.ticsUntilDirectionChange[heroEid] = 0;
  WanderPersistence.ticsUntilSpeedChange[heroEid] = 0;
}

/**
 * Orders the hero to move to the given tile. Pathfinds and sets the path; hero path system will consume it.
 */
export function orderHeroTo(
  world: SimulatorWorld,
  heroEid: number,
  tileX: number,
  tileY: number
): void {
  const pos = getComponent(world, heroEid, Position);
  if (pos == null) return;
  const from = { x: pos.x, y: pos.y };
  const to = { x: tileX, y: tileY };
  const rawPath = findPath(world, from, to);
  const path = simplifyPath(getPassableTiles(world), rawPath);
  const pathMap = getPathMap(world);
  // While following a commanded path, disable Wander so urge does not override path steering.
  removeComponent(world, heroEid, Wander);
  removeComponent(world, heroEid, WanderPersistence);
  if (path.length <= 1) {
    pathMap.delete(heroEid);
    enableHeroWander(world, heroEid);
    return;
  }
  pathMap.set(heroEid, path.slice(1));
}

/**
 * Returns the current path for the hero (waypoints remaining). Empty array if none.
 */
export function getHeroPath(
  world: SimulatorWorld,
  heroEid: number
): { x: number; y: number }[] {
  const pathMap = getPathMap(world);
  const path = pathMap.get(heroEid);
  return path ? [...path] : [];
}

/**
 * Hero path system: for each Hero entity with a non-empty path, steer toward path[0],
 * move; when close enough, remove path[0]; when path empty, set speed to 0.
 * Run before urge so hero is driven only by this (hero has no urge components).
 */
export function heroPathSystem(world: SimulatorWorld): SimulatorWorld {
  const pathMap = getPathMap(world);
  const heroes = query(world, [Position, Direction, Speed, Hero]);
  for (const eid of heroes) {
    const path = pathMap.get(eid);
    if (path == null || path.length === 0) {
      enableHeroWander(world, eid);
      continue;
    }
    const pos = getComponent(world, eid, Position);
    const way = path[0];
    const centerX = way.x + 0.5;
    const centerY = way.y + 0.5;
    const dist = Math.hypot(centerX - pos.x, centerY - pos.y);
    if (dist < REACHED_THRESHOLD) {
      path.shift();
      if (path.length === 0) {
        pathMap.delete(eid);
        enableHeroWander(world, eid);
        continue;
      }
    }
    const next = path[0];
    const nextCenterX = next.x + 0.5;
    const nextCenterY = next.y + 0.5;
    const angle = angleToward(pos.x, pos.y, nextCenterX, nextCenterY);
    setComponent(world, eid, Direction, { angle });
    setComponent(world, eid, Speed, { tilesPerSec: HERO_PATH_TPS });
  }
  return world;
}
