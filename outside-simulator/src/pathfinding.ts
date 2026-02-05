/**
 * Tile-grid pathfinding over walkable floor. Used by hero orderHeroTo.
 * @packageDocumentation
 */

import { query, getComponent } from 'bitecs';
import { Position, FloorTile, Walkable, Obstacle } from './components';
import type { SimulatorWorld } from './world';

function key(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Builds the set of passable tile coordinates (floor grid): FloorTile + Walkable, excluding Obstacle.
 */
export function getPassableTiles(world: SimulatorWorld): Set<string> {
  const walkable = new Set<string>();
  const floorWithWalkable = query(world, [Position, FloorTile, Walkable]);
  for (const eid of floorWithWalkable) {
    const pos = getComponent(world, eid, Position);
    const tx = Math.floor(pos.x);
    const ty = Math.floor(pos.y);
    walkable.add(key(tx, ty));
  }
  const walls = query(world, [Position, FloorTile, Obstacle]);
  for (const eid of walls) {
    const pos = getComponent(world, eid, Position);
    const tx = Math.floor(pos.x);
    const ty = Math.floor(pos.y);
    walkable.delete(key(tx, ty));
  }
  return walkable;
}

const NEIGHBORS_4 = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

/**
 * Enumerates tiles crossed by the line from (ax, ay) to (bx, by) using Bresenham.
 * Used for line-of-sight checks.
 */
function tilesOnLine(
  ax: number,
  ay: number,
  bx: number,
  by: number
): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const dx = Math.abs(bx - ax);
  const dy = Math.abs(by - ay);
  const sx = ax < bx ? 1 : -1;
  const sy = ay < by ? 1 : -1;
  let err = dx - dy;
  let x = ax;
  let y = ay;
  for (;;) {
    cells.push({ x, y });
    if (x === bx && y === by) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return cells;
}

/**
 * Returns true if there is unobstructed line of sight between tile (ax, ay) and (bx, by):
 * every tile the line crosses is passable.
 */
function hasLineOfSight(
  passable: Set<string>,
  ax: number,
  ay: number,
  bx: number,
  by: number
): boolean {
  const cells = tilesOnLine(ax, ay, bx, by);
  for (const c of cells) {
    if (!passable.has(key(c.x, c.y))) return false;
  }
  return true;
}

/**
 * String-pulling: simplifies path to only waypoints where direction changes (no direct LOS).
 * Keeps the most direct route using unobstructed line of sight.
 */
export function simplifyPath(
  passable: Set<string>,
  path: { x: number; y: number }[]
): { x: number; y: number }[] {
  if (path.length <= 2) return path;
  const result: { x: number; y: number }[] = [path[0]];
  let i = 0;
  while (i < path.length - 1) {
    let furthest = i + 1;
    for (let j = i + 2; j < path.length; j++) {
      if (hasLineOfSight(passable, path[i].x, path[i].y, path[j].x, path[j].y)) {
        furthest = j;
      } else {
        break;
      }
    }
    result.push(path[furthest]);
    i = furthest;
  }
  return result;
}

/**
 * A* pathfinding from (from.x, from.y) to (to.x, to.y). Returns ordered list of tile coords
 * (from start to goal). Returns empty array if no path or if start/goal not passable.
 */
export function findPath(
  world: SimulatorWorld,
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x: number; y: number }[] {
  const passable = getPassableTiles(world);
  const sx = Math.floor(from.x);
  const sy = Math.floor(from.y);
  const tx = Math.floor(to.x);
  const ty = Math.floor(to.y);
  const startKey = key(sx, sy);
  const goalKey = key(tx, ty);
  if (!passable.has(startKey) || !passable.has(goalKey)) return [];

  const open: { x: number; y: number; g: number; f: number }[] = [
    { x: sx, y: sy, g: 0, f: Math.abs(tx - sx) + Math.abs(ty - sy) },
  ];
  const cameFrom = new Map<string, { x: number; y: number }>();
  const gScore = new Map<string, number>();
  gScore.set(startKey, 0);

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const ckey = key(current.x, current.y);
    if (ckey === goalKey) {
      const path: { x: number; y: number }[] = [];
      let cur: { x: number; y: number } | undefined = { x: current.x, y: current.y };
      while (cur != null) {
        path.unshift(cur);
        cur = cameFrom.get(key(cur.x, cur.y));
      }
      return path;
    }
    for (const [dx, dy] of NEIGHBORS_4) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const nkey = key(nx, ny);
      if (!passable.has(nkey)) continue;
      const tentativeG = (gScore.get(ckey) ?? Infinity) + 1;
      if (tentativeG >= (gScore.get(nkey) ?? Infinity)) continue;
      cameFrom.set(nkey, { x: current.x, y: current.y });
      gScore.set(nkey, tentativeG);
      const h = Math.abs(tx - nx) + Math.abs(ty - ny);
      open.push({ x: nx, y: ny, g: tentativeG, f: tentativeG + h });
    }
  }
  return [];
}
