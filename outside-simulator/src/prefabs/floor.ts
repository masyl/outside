/**
 * Floor tile spawning: Position = bottom-left in world space, Size = cell (1×1).
 * @packageDocumentation
 */

import { addEntity, addComponent, setComponent } from 'bitecs';
import { Position, Size, FloorTile, Walkable, Obstacle } from '../components';
import type { SimulatorWorld } from '../world';

/** Default floor tile cell size (1 unit = floor grid resolution). */
const FLOOR_CELL_SIZE = 1;

/**
 * Spawns a floor tile at (x, y); Position is the bottom-left corner of the tile.
 *
 * @param world - Simulator world
 * @param x - World x (bottom-left)
 * @param y - World y (bottom-left)
 * @param walkable - If true, entity gets Walkable tag (walkable tile)
 * @returns New entity id
 */
export function spawnFloorTile(
  world: SimulatorWorld,
  x: number,
  y: number,
  walkable: boolean
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  setComponent(world, eid, Position, { x, y });
  addComponent(world, eid, Size);
  setComponent(world, eid, Size, { diameter: FLOOR_CELL_SIZE });
  addComponent(world, eid, FloorTile);
  if (walkable) {
    addComponent(world, eid, Walkable);
  }
  return eid;
}

/**
 * Spawns a wall at (x, y): FloorTile + Obstacle (blocking), no Walkable.
 * Position = bottom-left; rendered as solid light grey in Storybook.
 *
 * @param world - Simulator world
 * @param x - World x (bottom-left)
 * @param y - World y (bottom-left)
 * @returns New entity id
 */
export function spawnWall(
  world: SimulatorWorld,
  x: number,
  y: number
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Position);
  setComponent(world, eid, Position, { x, y });
  addComponent(world, eid, Size);
  setComponent(world, eid, Size, { diameter: FLOOR_CELL_SIZE });
  addComponent(world, eid, FloorTile);
  addComponent(world, eid, Obstacle);
  return eid;
}

/**
 * Spawns floor tiles in a rectangle [xMin, xMax] × [yMin, yMax] (integer cells, floor grid resolution 1).
 *
 * @param world - Simulator world
 * @param xMin - Minimum x (inclusive)
 * @param yMin - Minimum y (inclusive)
 * @param xMax - Maximum x (inclusive)
 * @param yMax - Maximum y (inclusive)
 * @param walkable - If true, tiles get Walkable tag
 */
export function spawnFloorRect(
  world: SimulatorWorld,
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
  walkable: boolean
): void {
  const xLo = Math.floor(xMin);
  const xHi = Math.floor(xMax);
  const yLo = Math.floor(yMin);
  const yHi = Math.floor(yMax);
  for (let x = xLo; x <= xHi; x++) {
    for (let y = yLo; y <= yHi; y++) {
      spawnFloorTile(world, x, y, walkable);
    }
  }
}
