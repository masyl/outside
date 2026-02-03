import { describe, it, expect } from 'vitest';
import {
  createWorld,
  spawnBot,
  spawnFloorTile,
  spawnWall,
  runTics,
  query,
  getComponent,
  Position,
  Direction,
  FloorTile,
  Grid,
  GridResolution,
  FLOOR_TILES_RESOLUTION,
  SUB_POSITION_SNAP_RESOLUTION,
} from './index';

describe('Default grids', () => {
  it('world has two grid entities with floorTiles and subPositionSnap resolutions', () => {
    const world = createWorld({ seed: 1, ticDurationMs: 50 });
    const grids = query(world, [Grid, GridResolution]);
    expect(grids).toHaveLength(2);
    const values = grids.map((eid) => getComponent(world, eid, GridResolution).value);
    expect(values).toContain(FLOOR_TILES_RESOLUTION);
    expect(values).toContain(SUB_POSITION_SNAP_RESOLUTION);
  });
});

describe('Obstacle collision (every 4 tics)', () => {
  it('pushes bot out and bounces when bot overlaps wall', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    spawnWall(world, 0.5, 0);
    spawnBot(world, { x: 0, y: 0, directionRad: 0, tilesPerSec: 10, urge: 'wander' });
    runTics(world, 5);
    const bots = query(world, [Position, Direction]);
    const pos = getComponent(world, bots[0], Position);
    expect(pos.x).toBeLessThan(0.5);
    expect(Math.abs(pos.y)).toBeLessThan(0.5);
  });

  it('does not revert when tile is walkable (no obstacle)', () => {
    const world = createWorld({ seed: 99, ticDurationMs: 50 });
    spawnFloorTile(world, 0.5, 0, true);
    spawnBot(world, { x: 0, y: 0, directionRad: 0, tilesPerSec: 10, urge: 'wander' });
    runTics(world, 1);
    const bots = query(world, [Position]);
    const pos = getComponent(world, bots[0], Position);
    expect(pos.x).toBeGreaterThan(0);
  });
});
