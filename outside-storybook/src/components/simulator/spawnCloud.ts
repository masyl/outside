import {
  spawnBot,
  spawnFloorRect,
  spawnFloorTile,
  spawnWall,
  spawnFood,
  spawnHero,
  setViewportFollowTarget,
} from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';
import { generateDungeon } from '../../utils/dungeonLayout';

/**
 * Spawns count bots in a follow chain: first is leader (Wander), rest Follow previous.
 */
export function spawnFollowChain(
  world: SimulatorWorld,
  _seed: number,
  count: number
): void {
  if (count < 1) return;
  const leader = spawnBot(world, { x: 0, y: 0 });
  let prev = leader;
  for (let i = 1; i < count; i++) {
    prev = spawnBot(world, {
      x: 3 * i,
      y: 0,
      urge: 'follow',
      followTargetEid: prev,
    });
  }
}

/** Deterministic 0..1 from seed; same seed + index gives same cloud. */
export function seededUnit(seed: number, index: number): number {
  const n = (seed + index * 7919) | 0;
  const t = Math.sin(n * 12.9898 + index * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

/**
 * Same scatter as spawnBotsInWorld: positions from seeded cloud.
 * Used by spawnBotsInWorld and spawnScatteredWithLeaders.
 */
function scatterPositions(
  seed: number,
  entityCount: number
): { x: number; y: number; angle: number }[] {
  const maxRadius = entityCount <= 1 ? 0 : 2 + Math.sqrt(entityCount) * 2;
  const out: { x: number; y: number; angle: number }[] = [];
  for (let i = 0; i < entityCount; i++) {
    const t = entityCount <= 1 ? 0 : i / (entityCount - 1);
    const angle = seededUnit(seed, i * 2) * Math.PI * 2;
    const r = Math.sqrt(seededUnit(seed, i * 2 + 1));
    const radius = (0.15 + 0.85 * t) * maxRadius * r;
    out.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      angle: seededUnit(seed, i * 3) * Math.PI * 2,
    });
  }
  return out;
}

/**
 * Creates a world, spawns entityCount bots in a scattered cloud (near center first, further as count grows).
 */
export function spawnBotsInWorld(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  const positions = scatterPositions(seed, entityCount);
  for (let i = 0; i < entityCount; i++) {
    const p = positions[i];
    spawnBot(world, {
      x: p.x,
      y: p.y,
      directionRad: p.angle,
      tilesPerSec: 1 + (i % 3) * 0.3,
    });
  }
}

/**
 * Spawns a walkable floor rectangle with wall perimeter, then entities scattered with leaders.
 * Floor rect -30..30 x -20..20; walls drawn around the border.
 */
export function spawnFloorRectThenScattered(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  spawnFloorRectThenScatteredWithSize(world, seed, entityCount, 60, 40);
}

/**
 * Spawns a walkable floor rectangle with wall perimeter, then entities scattered with leaders.
 * Room is centered at (0,0) with given width and height (in tiles).
 */
export function spawnFloorRectThenScatteredWithSize(
  world: SimulatorWorld,
  seed: number,
  entityCount: number,
  width: number,
  height: number
): void {
  const xMin = -width / 2;
  const yMin = -height / 2;
  const xMax = width / 2;
  const yMax = height / 2;
  spawnFloorRect(world, xMin, yMin, xMax, yMax, true);
  for (let x = xMin - 1; x <= xMax + 1; x++) {
    spawnWall(world, x, yMin - 1);
    spawnWall(world, x, yMax + 1);
  }
  for (let y = yMin; y <= yMax; y++) {
    spawnWall(world, xMin - 1, y);
    spawnWall(world, xMax + 1, y);
  }
  spawnScatteredWithLeaders(world, seed, entityCount);
}

/**
 * Returns a spawn function for a rectangular room with the given dimensions.
 * Use when room width/height are controlled dynamically (e.g. Storybook controls).
 */
export function createFloorRectSpawn(
  width: number,
  height: number
): (world: SimulatorWorld, seed: number, entityCount: number) => void {
  return (world, seed, entityCount) =>
    spawnFloorRectThenScatteredWithSize(world, seed, entityCount, width, height);
}

/**
 * Floor rect with wall perimeter, one hero at center (0,0), then entityCount bots scattered with leaders.
 * Sets viewport follow target to the hero so the camera follows the player character by default.
 */
export function spawnFloorRectWithHero(
  world: SimulatorWorld,
  seed: number,
  entityCount: number,
  width: number = 60,
  height: number = 40
): void {
  const xMin = -width / 2;
  const yMin = -height / 2;
  const xMax = width / 2;
  const yMax = height / 2;
  spawnFloorRect(world, xMin, yMin, xMax, yMax, true);
  for (let x = xMin - 1; x <= xMax + 1; x++) {
    spawnWall(world, x, yMin - 1);
    spawnWall(world, x, yMax + 1);
  }
  for (let y = yMin; y <= yMax; y++) {
    spawnWall(world, xMin - 1, y);
    spawnWall(world, xMax + 1, y);
  }
  const heroEid = spawnHero(world, { x: 0, y: 0 });
  setViewportFollowTarget(world, heroEid);
  spawnScatteredWithLeaders(world, seed, entityCount);
}

/**
 * Returns a spawn function for floor rect + hero + bots (for Storybook preset).
 */
export function createFloorRectWithHeroSpawn(
  width: number,
  height: number
): (world: SimulatorWorld, seed: number, entityCount: number) => void {
  return (world, seed, entityCount) =>
    spawnFloorRectWithHero(world, seed, entityCount, width, height);
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * After floor tiles are spawned from grid, add walls around every room and corridor:
 * build an index of floor coordinates, then for each floor cell add a wall at any
 * adjacent empty cell; update the index as walls are added.
 */
function spawnWallsAroundFloor(
  world: SimulatorWorld,
  grid: boolean[][],
  width: number,
  height: number,
  offsetX: number,
  offsetY: number
): void {
  const filled = new Set<string>();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y]) filled.add(key(x, y));
    }
  }
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!grid[x][y]) continue;
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (filled.has(key(nx, ny))) continue;
        spawnWall(world, nx + offsetX, ny + offsetY);
        filled.add(key(nx, ny));
      }
    }
  }
}

/**
 * Spawns a dungeon layout (rooms + 2-tile corridors) as floor tiles, walls around each room and corridor, then entities only inside rooms (all Wander).
 * Dungeon is 80×50 cells, centered at world (0,0). Bots are sprinkled in room cells only; no follow mechanic.
 */
export function spawnDungeonThenScattered(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  const width = 80;
  const height = 50;
  const offsetX = -width / 2;
  const offsetY = -height / 2;
  const { grid, roomCells } = generateDungeon(width, height, seed);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y]) {
        spawnFloorTile(world, x + offsetX, y + offsetY, true);
      }
    }
  }
  spawnWallsAroundFloor(world, grid, width, height, offsetX, offsetY);
  if (roomCells.length === 0) return;
  for (let i = 0; i < entityCount; i++) {
    const idx =
      Math.floor(seededUnit(seed, i) * roomCells.length) % roomCells.length;
    const p = roomCells[idx];
    const cx = p.x + offsetX + 0.5;
    const cy = p.y + offsetY + 0.5;
    const angle = seededUnit(seed, i * 2) * Math.PI * 2;
    spawnBot(world, {
      x: cx,
      y: cy,
      directionRad: angle,
      urge: 'wander',
    });
  }
}

/** Number of food items to spawn in dungeon-with-food demo. */
const DUNGEON_FOOD_COUNT = 12;

/**
 * Same as spawnDungeonThenScattered plus food items in room cells.
 * Bots can overlap food to consume it; food disappears and consumed events fire.
 */
export function spawnDungeonWithFood(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  spawnDungeonThenScattered(world, seed, entityCount);
  const { roomCells } = generateDungeon(80, 50, seed);
  if (roomCells.length === 0) return;
  const offsetX = -40;
  const offsetY = -25;
  for (let i = 0; i < DUNGEON_FOOD_COUNT; i++) {
    const idx =
      Math.floor(seededUnit(seed, 1000 + i) * roomCells.length) %
      roomCells.length;
    const p = roomCells[idx];
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnFood(world, { x, y });
  }
}

/** Food count for dungeon-with-hero preset. */
const DUNGEON_HERO_FOOD_COUNT = 12;

/** Bot count for dungeon-with-hero preset. */
const DUNGEON_HERO_BOT_COUNT = 9;

/**
 * Dungeon layout with 12 food items, 9 bots, and 1 hero. Camera follows the hero.
 * Click floor tiles to order the hero there; path uses line-of-sight simplification.
 */
export function spawnDungeonWithFoodAndHero(
  world: SimulatorWorld,
  seed: number,
  _entityCount: number
): void {
  const width = 80;
  const height = 50;
  const offsetX = -width / 2;
  const offsetY = -height / 2;
  const { grid, roomCells } = generateDungeon(width, height, seed);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y]) {
        spawnFloorTile(world, x + offsetX, y + offsetY, true);
      }
    }
  }
  spawnWallsAroundFloor(world, grid, width, height, offsetX, offsetY);
  if (roomCells.length === 0) return;
  for (let i = 0; i < DUNGEON_HERO_BOT_COUNT; i++) {
    const idx =
      Math.floor(seededUnit(seed, i) * roomCells.length) % roomCells.length;
    const p = roomCells[idx];
    const cx = p.x + offsetX + 0.5;
    const cy = p.y + offsetY + 0.5;
    const angle = seededUnit(seed, i * 2) * Math.PI * 2;
    spawnBot(world, {
      x: cx,
      y: cy,
      directionRad: angle,
      urge: 'wander',
    });
  }
  for (let i = 0; i < DUNGEON_HERO_FOOD_COUNT; i++) {
    const idx =
      Math.floor(seededUnit(seed, 1000 + i) * roomCells.length) %
      roomCells.length;
    const p = roomCells[idx];
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnFood(world, { x, y });
  }
  const heroIdx =
    Math.floor(seededUnit(seed, 2000) * roomCells.length) % roomCells.length;
  const heroCell = roomCells[heroIdx];
  const heroX = heroCell.x + offsetX + 0.5;
  const heroY = heroCell.y + offsetY + 0.5;
  const heroEid = spawnHero(world, { x: heroX, y: heroY });
  setViewportFollowTarget(world, heroEid);
}

/**
 * Same scattering algorithm as spawnBotsInWorld; 1 in 5 bots are leaders (Wander), rest Follow that leader.
 */
export function spawnScatteredWithLeaders(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  const positions = scatterPositions(seed, entityCount);
  let lastLeaderEid: number | null = null;
  for (let i = 0; i < entityCount; i++) {
    const p = positions[i];
    const isLeader = i % 5 === 0;
    if (isLeader) {
      lastLeaderEid = spawnBot(world, {
        x: p.x,
        y: p.y,
        directionRad: p.angle,
        urge: 'wander',
      });
    } else {
      spawnBot(world, {
        x: p.x,
        y: p.y,
        directionRad: p.angle,
        urge: 'follow',
        followTargetEid: lastLeaderEid!,
      });
    }
  }
}
