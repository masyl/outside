/**
 * WFC-based dungeon layout generator (Storybook utility).
 * Returns the same DungeonResult contract as dungeonLayout.ts; falls back to room-and-corridor on WFC failure.
 */

import { SimpleTiledModel } from 'wavefunctioncollapse';
import type { DungeonResult } from './dungeonLayout';
import { generateDungeon } from './dungeonLayout';

/** Seeded 0..1 from seed + index (deterministic). */
function seeded(seed: number, index: number): number {
  const n = (seed + index * 7919) | 0;
  const t = Math.sin(n * 12.9898 + index * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

/** Build a seeded RNG for the WFC library (returns 0..1). */
function seededRng(seed: number): () => number {
  let index = 0;
  return () => seeded(seed, index++);
}

const TILESIZE = 1;
/** Floor: green pixel; Wall: dark gray. */
const FLOOR_RGBA = new Uint8Array([0x40, 0xa0, 0x40, 255]);
const WALL_RGBA = new Uint8Array([0x40, 0x40, 0x40, 255]);

const DUNGEON_WFC_DATA = {
  tilesize: TILESIZE,
  tiles: [
    { name: 'floor', symmetry: 'X', bitmap: FLOOR_RGBA, weight: 2 },
    { name: 'wall', symmetry: 'X', bitmap: WALL_RGBA, weight: 1 },
  ],
  /** Adjacency rules (library key "neighbors"): which tiles can sit next to each other on any of 4 sides. */
  neighbors: [
    { left: 'floor', right: 'floor' },
    { left: 'floor', right: 'wall' },
    { left: 'wall', right: 'floor' },
    { left: 'wall', right: 'wall' },
  ],
};

/** Tile index for floor in our tileset (first tile = 0). */
const FLOOR_TILE_INDEX = 0;

const MAX_RETRIES = 3;

/**
 * Generates a dungeon grid using wave function collapse. Returns the same DungeonResult as generateDungeon.
 * On contradiction or failure, retries up to MAX_RETRIES then falls back to the room-and-corridor generator.
 *
 * @param width - Grid width (cells)
 * @param height - Grid height (cells)
 * @param seed - RNG seed for deterministic layout
 * @returns Grid and list of floor cells for spawning
 */
export function generateDungeonWFC(
  width: number,
  height: number,
  seed: number
): DungeonResult {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const rng = seededRng(seed + attempt * 100000);
    const model = new SimpleTiledModel(
      DUNGEON_WFC_DATA,
      null,
      width,
      height,
      false
    );
    const ok = model.generate(rng);
    if (ok && model.isGenerationComplete() && model.observed) {
      const grid: boolean[][] = Array.from({ length: width }, () =>
        Array(height).fill(false)
      );
      const roomCells: { x: number; y: number }[] = [];
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const i = x + y * width;
          const tileIndex = model.observed[i];
          const isFloor = tileIndex === FLOOR_TILE_INDEX;
          grid[x][y] = isFloor;
          if (isFloor) {
            roomCells.push({ x, y });
          }
        }
      }
      return { grid, roomCells };
    }
  }
  return generateDungeon(width, height, seed);
}
