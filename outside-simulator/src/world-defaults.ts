/**
 * Default world setup: add default grid entities (floorTiles, subPositionSnap) when world is created.
 * @packageDocumentation
 */

import { addEntity, addComponent, setComponent } from 'bitecs';
import { Grid, GridResolution } from './components';
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
