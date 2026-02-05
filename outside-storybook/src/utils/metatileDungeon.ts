/**
 * MetaTile-based dungeon generator (Storybook utility).
 * 16×16 MetaTiles built from Exits, Gaps, Sides, Frames, Interiors.
 * Empty, Wall, Floor are distinct; output uses optional wallGrid so Empty stays void.
 */

import type { DungeonResult } from './dungeonLayout';
import { generateDungeon } from './dungeonLayout';

export type TileKind = 'empty' | 'wall' | 'floor';

const META_SIZE = 16;
const SIDE_LENGTH = 16;
const INTERIOR_SIZE = 14;
const EXIT_FLOOR_MIN = 2;
const EXIT_FLOOR_MAX = 12;
const GAP_MIN = 2;
const GAP_MAX = 8;
const FRAME_MAX_EXITS = 8;

/** Seeded 0..1 from seed + index (deterministic). */
function seeded(seed: number, index: number): number {
  const n = (seed + index * 7919) | 0;
  const t = Math.sin(n * 12.9898 + index * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

function createRng(seed: number): () => number {
  let i = 0;
  return () => seeded(seed, i++);
}

/** Pick integer in [min, max] inclusive. */
function int(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Exit: Wall, then 2–12 Floor, then Empty. Length 4..14. */
function generateExitWithLength(rng: () => number, floorCount: number): TileKind[] {
  const out: TileKind[] = ['wall'];
  for (let i = 0; i < floorCount; i++) out.push('floor');
  out.push('empty');
  return out;
}

/** Gap: exactly n Empty (n in [2,8]). */
function generateGapOfLength(n: number): TileKind[] {
  return Array(n).fill('empty');
}

/** Side: length exactly 16. One Gap + one Exit: G + E = 16, G in [2,8], E in [4,14] so E in [8,14]. */
function generateSide(rng: () => number): TileKind[] {
  const exitLen = int(rng, 8, 14);
  const gapLen = SIDE_LENGTH - exitLen;
  const floorCount = exitLen - 2;
  const gap = generateGapOfLength(gapLen);
  const exit = generateExitWithLength(rng, floorCount);
  return [...gap, ...exit];
}

function countExits(side: TileKind[]): number {
  let n = 0;
  let inExit = false;
  for (const t of side) {
    if (t === 'wall') inExit = true;
    if (inExit && t === 'empty') {
      n++;
      inExit = false;
    }
  }
  return n;
}

/** Frame: 4 Sides; total exits ≤ 8. */
function generateFrame(rng: () => number): {
  top: TileKind[];
  bottom: TileKind[];
  left: TileKind[];
  right: TileKind[];
} {
  for (let attempt = 0; attempt < 50; attempt++) {
    const top = generateSide(rng);
    const bottom = generateSide(rng);
    const left = generateSide(rng);
    const right = generateSide(rng);
    const total =
      countExits(top) + countExits(bottom) + countExits(left) + countExits(right);
    if (total <= FRAME_MAX_EXITS) {
      return { top, bottom, left, right };
    }
  }
  return {
    top: Array(SIDE_LENGTH).fill('empty'),
    bottom: Array(SIDE_LENGTH).fill('empty'),
    left: Array(SIDE_LENGTH).fill('empty'),
    right: Array(SIDE_LENGTH).fill('empty'),
  };
}

/** Interior 14×14: Floor only next to Floor or Wall; every Floor ≥2 Floor neighbors; every Wall ≥2 Wall neighbors. */
function generateInterior(rng: () => number, frame: {
  top: TileKind[];
  bottom: TileKind[];
  left: TileKind[];
  right: TileKind[];
}): TileKind[][] {
  const I = INTERIOR_SIZE;
  const grid: TileKind[][] = Array.from({ length: I }, () => Array(I).fill('empty'));
  const neighbors = (x: number, y: number): TileKind[] => {
    const out: TileKind[] = [];
    if (x > 0) out.push(grid[x - 1][y]);
    if (x < I - 1) out.push(grid[x + 1][y]);
    if (y > 0) out.push(grid[x][y - 1]);
    if (y < I - 1) out.push(grid[x][y + 1]);
    return out;
  };
  const canBeFloor = (x: number, y: number): boolean => {
    const n = neighbors(x, y);
    const floor = n.filter((t) => t === 'floor').length;
    const wall = n.filter((t) => t === 'wall').length;
    if (floor + wall < n.length && n.some((t) => t === 'empty')) return false;
    return floor >= 2 || (floor >= 1 && wall >= 1);
  };
  const canBeWall = (x: number, y: number): boolean => {
    const n = neighbors(x, y);
    const wall = n.filter((t) => t === 'wall').length;
    return wall >= 2 || n.every((t) => t === 'empty');
  };
  for (let y = 0; y < I; y++) {
    for (let x = 0; x < I; x++) {
      const n = neighbors(x, y);
      const empty = n.filter((t) => t === 'empty').length;
      const floor = n.filter((t) => t === 'floor').length;
      const wall = n.filter((t) => t === 'wall').length;
      if (empty === 4) {
        grid[x][y] = rng() < 0.4 ? 'floor' : rng() < 0.5 ? 'wall' : 'empty';
      } else {
        if (canBeFloor(x, y) && (floor >= 1 || rng() < 0.35)) {
          grid[x][y] = 'floor';
        } else if (canBeWall(x, y) && (wall >= 1 || rng() < 0.3)) {
          grid[x][y] = 'wall';
        } else {
          grid[x][y] = 'empty';
        }
      }
    }
  }
  return grid;
}

/** Assemble 16×16 MetaTile from frame + interior. Top/bottom = rows 0 and 15; left/right = cols 0 and 15; corners from top/bottom. */
function assembleMetaTile(
  frame: { top: TileKind[]; bottom: TileKind[]; left: TileKind[]; right: TileKind[] },
  interior: TileKind[][]
): TileKind[][] {
  const g: TileKind[][] = Array.from({ length: META_SIZE }, () =>
    Array(META_SIZE).fill('empty' as TileKind)
  );
  for (let i = 0; i < SIDE_LENGTH; i++) {
    g[i][0] = frame.top[i];
    g[i][META_SIZE - 1] = frame.bottom[i];
    g[0][i] = frame.left[i];
    g[META_SIZE - 1][i] = frame.right[i];
  }
  for (let x = 0; x < INTERIOR_SIZE; x++) {
    for (let y = 0; y < INTERIOR_SIZE; y++) {
      g[x + 1][y + 1] = interior[x][y];
    }
  }
  return g;
}

/** Generate one MetaTile at random (seeded). */
function generateOneMetaTile(rng: () => number): TileKind[][] {
  const frame = generateFrame(rng);
  const interior = generateInterior(rng, frame);
  return assembleMetaTile(frame, interior);
}

export interface MetaTileDungeonResult extends DungeonResult {
  /** When set, spawn wall only where true; Empty where both grid and wallGrid are false. */
  wallGrid: boolean[][];
}

/**
 * Generate a dungeon as a grid of MetaTiles (each 16×16). Dimensions in MetaTiles; output in tiles.
 * Empty and Wall are distinct; result includes wallGrid so spawn can leave Empty as void.
 */
export function generateDungeonMetaTiles(
  metaWidth: number,
  metaHeight: number,
  seed: number
): MetaTileDungeonResult {
  const width = metaWidth * META_SIZE;
  const height = metaHeight * META_SIZE;
  const grid: boolean[][] = Array.from({ length: width }, () =>
    Array(height).fill(false)
  );
  const wallGrid: boolean[][] = Array.from({ length: width }, () =>
    Array(height).fill(false)
  );
  const roomCells: { x: number; y: number }[] = [];
  let rngIndex = 0;
  const rng = () => seeded(seed, rngIndex++);

  for (let my = 0; my < metaHeight; my++) {
    for (let mx = 0; mx < metaWidth; mx++) {
      const meta = generateOneMetaTile(rng);
      const ox = mx * META_SIZE;
      const oy = my * META_SIZE;
      for (let tx = 0; tx < META_SIZE; tx++) {
        for (let ty = 0; ty < META_SIZE; ty++) {
          const x = ox + tx;
          const y = oy + ty;
          const t = meta[tx][ty];
          if (t === 'floor') {
            grid[x][y] = true;
            roomCells.push({ x, y });
          } else if (t === 'wall') {
            wallGrid[x][y] = true;
          }
        }
      }
    }
  }

  return { grid, roomCells, wallGrid };
}
