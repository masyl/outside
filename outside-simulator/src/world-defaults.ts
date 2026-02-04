/**
 * Default world setup: add default grid entities (floorTiles, subPositionSnap) when world is created.
 * @packageDocumentation
 */

import { addEntity, addComponent, setComponent } from 'bitecs';
import { Grid, GridResolution, View, IsViewportFocus, Pointer, PointerTile } from './components';
import type { SimulatorWorld } from './world';

/** Resolution for floor tiles grid (1 = integer cells). */
export const FLOOR_TILES_RESOLUTION = 1;
/** Resolution for sub-position snap grid (0.125 = 8 snap positions per 1 unit). */
export const SUB_POSITION_SNAP_RESOLUTION = 0.125;

/**
 * Adds the default grid entities to the world: floorTiles (resolution 1), subPositionSnap (resolution 0.125).
 * Called from createWorld.
 */
export function addDefaultGrids(world: SimulatorWorld): void {
  const floorTilesEid = addEntity(world);
  addComponent(world, floorTilesEid, Grid);
  addComponent(world, floorTilesEid, GridResolution);
  GridResolution.value[floorTilesEid] = FLOOR_TILES_RESOLUTION;

  const subSnapEid = addEntity(world);
  addComponent(world, subSnapEid, Grid);
  addComponent(world, subSnapEid, GridResolution);
  GridResolution.value[subSnapEid] = SUB_POSITION_SNAP_RESOLUTION;
}

/**
 * Adds the View entity (View + IsViewportFocus). The viewport renderer centers on the follow target when set.
 * Called from createWorld.
 */
export function addViewEntity(world: SimulatorWorld): number {
  const viewEid = addEntity(world);
  addComponent(world, viewEid, View);
  addComponent(world, viewEid, IsViewportFocus);
  IsViewportFocus.eid[viewEid] = 0;
  return viewEid;
}

/**
 * Adds the Pointer entity (Pointer + PointerTile). Holds current pointer tile (x, y) in floor grid resolution.
 * Called from createWorld.
 */
export function addPointerEntity(world: SimulatorWorld): number {
  const pointerEid = addEntity(world);
  addComponent(world, pointerEid, Pointer);
  addComponent(world, pointerEid, PointerTile);
  PointerTile.tileX[pointerEid] = Number.NaN;
  PointerTile.tileY[pointerEid] = Number.NaN;
  return pointerEid;
}
