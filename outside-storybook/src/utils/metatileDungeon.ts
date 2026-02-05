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

/** Exit with given floor count: Wall + floorCount Floor + Wall. Length = floorCount + 2 (4..14). */
function exitWithFloorCount(floorCount: number): TileKind[] {
  const out: TileKind[] = ['wall'];
  for (let i = 0; i < floorCount; i++) out.push('floor');
  out.push('wall');
  return out;
}

/** Exit: Wall, then 2–12 Floor, then Wall. Length 4..14. */
function generateExitWithLength(rng: () => number, floorCount: number): TileKind[] {
  return exitWithFloorCount(floorCount);
}

/** Gap: exactly n Empty (n in [2,8]). */
function generateGapOfLength(n: number): TileKind[] {
  return Array(n).fill('empty');
}

/**
 * The complete set of possible Gaps: exactly 7, one per length 2..8.
 * A gap is only defined by its length (that many Empty tiles); no other variation.
 */
export function getAllPossibleGaps(): TileKind[][] {
  const out: TileKind[][] = [];
  for (let n = GAP_MIN; n <= GAP_MAX; n++) {
    out.push(generateGapOfLength(n));
  }
  return out;
}

/**
 * Generate a random sample of gaps (for comparison). Use getAllPossibleGaps() for the complete set.
 */
export function generateGaps(seed: number, count: number): TileKind[][] {
  const rng = createRng(seed);
  const out: TileKind[][] = [];
  for (let i = 0; i < count; i++) {
    const n = int(rng, GAP_MIN, GAP_MAX);
    out.push(generateGapOfLength(n));
  }
  return out;
}

/**
 * The complete set of possible Exits: exactly 11, one per floor count 2..12.
 * Each exit is Wall + floorCount Floor + Wall (length 4..14).
 */
export function getAllPossibleExits(): TileKind[][] {
  const out: TileKind[][] = [];
  for (let f = EXIT_FLOOR_MIN; f <= EXIT_FLOOR_MAX; f++) {
    out.push(exitWithFloorCount(f));
  }
  return out;
}

/**
 * Generate a set of Exits for inspection. Each exit is Wall + (2–12 Floor) + Wall.
 * Deterministic for a given seed.
 */
export function generateExits(seed: number, count: number): TileKind[][] {
  const rng = createRng(seed);
  const out: TileKind[][] = [];
  for (let i = 0; i < count; i++) {
    const floorCount = int(rng, EXIT_FLOOR_MIN, EXIT_FLOOR_MAX);
    out.push(generateExitWithLength(rng, floorCount));
  }
  return out;
}

export const GAP_MIN_EXPORT = GAP_MIN;
export const GAP_MAX_EXPORT = GAP_MAX;
export const EXIT_FLOOR_MIN_EXPORT = EXIT_FLOOR_MIN;
export const EXIT_FLOOR_MAX_EXPORT = EXIT_FLOOR_MAX;

/**
 * Build one side from segment lengths: [gapLen, exitLen, gapLen, ...] ending with a gap.
 * Exit length 4..14; floorCount = exitLen - 2.
 */
function buildSideFromSegments(segments: number[]): TileKind[] {
  const out: TileKind[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 0) {
      out.push(...generateGapOfLength(segments[i]));
    } else {
      const exitLen = segments[i];
      const floorCount = exitLen - 2;
      out.push(...exitWithFloorCount(floorCount));
    }
  }
  return out;
}

/** Enumerate all valid side segment sequences: start with Gap, alternate Exit/Gap, end with Gap; total 16. */
function enumerateSideSegments(): number[][] {
  const results: number[][] = [];
  function addGap(segments: number[], sum: number): void {
    for (let g = GAP_MIN; g <= GAP_MAX; g++) {
      const newSum = sum + g;
      if (newSum === SIDE_LENGTH) {
        results.push([...segments, g]);
      } else if (newSum < SIDE_LENGTH) {
        addExit([...segments, g], newSum);
      }
    }
  }
  function addExit(segments: number[], sum: number): void {
    for (let e = 4; e <= 14; e++) {
      const newSum = sum + e;
      if (newSum < SIDE_LENGTH && newSum + GAP_MIN <= SIDE_LENGTH) {
        addGap([...segments, e], newSum);
      }
    }
  }
  addGap([], 0);
  return results;
}

/**
 * The complete set of possible Sides: all valid sequences of Gaps and Exits that sum to 16.
 * First segment is always a Gap; Exits are always followed by a Gap; last segment is always a Gap.
 */
export function getAllPossibleSides(): TileKind[][] {
  const segmentLists = enumerateSideSegments();
  return segmentLists.map((segments) => buildSideFromSegments(segments));
}

/** All valid segment sequences (cached). */
let _cachedSegmentLists: number[][] | null = null;
function getValidSegmentLists(): number[][] {
  if (_cachedSegmentLists === null) _cachedSegmentLists = enumerateSideSegments();
  return _cachedSegmentLists;
}

/** Side: length exactly 16. Valid sequence: starts with Gap, alternates Gap/Exit, ends with Gap. */
function generateSide(rng: () => number): TileKind[] {
  const segmentLists = getValidSegmentLists();
  const idx = Math.floor(rng() * segmentLists.length) % segmentLists.length;
  const segments = segmentLists[idx];
  return buildSideFromSegments(segments);
}

/**
 * Random sample of sides (for comparison). Use getAllPossibleSides() for the complete set.
 */
export function generateSides(seed: number, count: number): TileKind[][] {
  const rng = createRng(seed);
  const out: TileKind[][] = [];
  for (let i = 0; i < count; i++) {
    out.push(generateSide(rng));
  }
  return out;
}

export const SIDE_LENGTH_EXPORT = SIDE_LENGTH;

/** Count exit segments in a side (each Wall→…→Empty transition = 1 exit; with Wall end, each Wall→…→next Gap = 1). */
export function countExitsInSide(side: TileKind[]): number {
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

function countExits(side: TileKind[]): number {
  return countExitsInSide(side);
}

export interface MetaTileFrame {
  top: TileKind[];
  bottom: TileKind[];
  left: TileKind[];
  right: TileKind[];
}

/** Frame: 4 Sides; total exits ≤ 8. */
function generateFrame(rng: () => number): MetaTileFrame {
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

/** Generate a single frame (4 sides, total exits ≤ 8). Deterministic for a given seed. */
export function generateSingleFrame(seed: number): MetaTileFrame {
  let i = 0;
  const rng = () => seeded(seed, i++);
  return generateFrame(rng);
}

/** Generate a single 14×14 interior for a frame. Uses same seed to build frame then interior. Deterministic. */
export function generateSingleInterior(seed: number): TileKind[][] {
  let i = 0;
  const rng = () => seeded(seed, i++);
  const frame = generateFrame(rng);
  return generateInterior(rng, frame);
}

export const INTERIOR_SIZE_EXPORT = INTERIOR_SIZE;

/** Generate a single 16×16 MetaTile. Deterministic for a given seed. */
export function generateSingleMetaTile(seed: number): TileKind[][] {
  let i = 0;
  const rng = () => seeded(seed, i++);
  return generateOneMetaTile(rng);
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
