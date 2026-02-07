/**
 * Dungeon-style layout generator (Storybook utility).
 * Returns a 2D grid: true = floor (walkable), false = wall.
 * Deterministic for a given seed.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectCenter(r: Rect): { x: number; y: number } {
  return {
    x: r.x + Math.floor(r.width / 2),
    y: r.y + Math.floor(r.height / 2),
  };
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x > b.x + b.width ||
    a.x + a.width < b.x ||
    a.y > b.y + b.height ||
    a.y + a.height < b.y
  );
}

/** Seeded 0..1 from seed + index (deterministic). */
function seeded(seed: number, index: number): number {
  const n = (seed + index * 7919) | 0;
  const t = Math.sin(n * 12.9898 + index * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

/** Corridor width in tiles. */
const CORRIDOR_WIDTH = 2;

function carveH(grid: boolean[][], x1: number, x2: number, y: number): void {
  const [lo, hi] = x1 <= x2 ? [x1, x2] : [x2, x1];
  const height = grid[0].length;
  for (let wy = 0; wy < CORRIDOR_WIDTH; wy++) {
    const row = y + wy;
    if (row < 0 || row >= height) continue;
    for (let x = lo; x <= hi; x++) {
      if (x >= 0 && x < grid.length) {
        grid[x][row] = true;
      }
    }
  }
}

function carveV(grid: boolean[][], x: number, y1: number, y2: number): void {
  const [lo, hi] = y1 <= y2 ? [y1, y2] : [y2, y1];
  const width = grid.length;
  for (let wx = 0; wx < CORRIDOR_WIDTH; wx++) {
    const col = x + wx;
    if (col < 0 || col >= width) continue;
    for (let y = lo; y <= hi; y++) {
      if (y >= 0 && y < grid[0].length) {
        grid[col][y] = true;
      }
    }
  }
}

export interface DungeonResult {
  /** grid[x][y] === true means floor (walkable) */
  grid: boolean[][];
  /** Cell coordinates that are inside rooms (for spawning bots; excludes corridors) */
  roomCells: { x: number; y: number }[];
}

/**
 * Generates a dungeon grid: rooms (floor) connected by 2-tile-wide tunnels.
 *
 * @param width - Grid width (cells)
 * @param height - Grid height (cells)
 * @param seed - RNG seed for deterministic layout
 * @param maxRooms - Max room attempts
 * @param minSize - Min room width/height
 * @param maxSize - Max room width/height
 * @returns Grid and list of room-only cells (for spawning)
 */
export function generateDungeon(
  width: number,
  height: number,
  seed: number,
  maxRooms = 25,
  minSize = 5,
  maxSize = 11
): DungeonResult {
  const grid: boolean[][] = Array.from({ length: width }, () =>
    Array(height).fill(false)
  );
  const roomCells: { x: number; y: number }[] = [];
  const rooms: Rect[] = [];
  let roomIndex = 0;

  for (let r = 0; r < maxRooms; r++) {
    const w = minSize + Math.floor(seeded(seed, roomIndex++) * (maxSize - minSize + 1));
    const h = minSize + Math.floor(seeded(seed, roomIndex++) * (maxSize - minSize + 1));
    const x = 1 + Math.floor(seeded(seed, roomIndex++) * (width - w - 2));
    const y = 1 + Math.floor(seeded(seed, roomIndex++) * (height - h - 2));

    const newRoom: Rect = { x, y, width: w, height: h };
    const overlaps = rooms.some((room) => rectsIntersect(room, newRoom));
    if (overlaps) continue;

    for (let rx = newRoom.x; rx < newRoom.x + newRoom.width; rx++) {
      for (let ry = newRoom.y; ry < newRoom.y + newRoom.height; ry++) {
        if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
          grid[rx][ry] = true;
          roomCells.push({ x: rx, y: ry });
        }
      }
    }

    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      const prevC = rectCenter(prev);
      const newC = rectCenter(newRoom);
      if (seeded(seed, roomIndex++) < 0.5) {
        carveH(grid, prevC.x, newC.x, prevC.y);
        carveV(grid, newC.x, prevC.y, newC.y);
      } else {
        carveV(grid, prevC.x, prevC.y, newC.y);
        carveH(grid, prevC.x, newC.x, newC.y);
      }
    }
    rooms.push(newRoom);
  }

  return { grid, roomCells };
}
