import {
  addEntity,
  addComponent,
  DefaultSpriteKey,
  Observed,
  PointerKind,
  Position,
  spawnBot,
  spawnFloorRect,
  spawnFloorTile,
  spawnWall,
  spawnFood,
  setComponent,
  TargetPace,
  TARGET_PACE_STANDING_STILL,
  spawnHero,
  spawnSoccerBall,
  setViewportFollowTarget,
  FollowStopRange,
  JumpHeightScale,
  SpeedBoostOnJump,
  setPointerSpriteKey,
} from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';
import { foodVariantIds, type FoodVariantId } from '@outside/resource-packs/pixel-platter/meta';
import {
  BEIGE_CAT_BOT_SPRITE_KEY,
  GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
  GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
} from '@outside/resource-packs/paws-whiskers/meta';
import {
  POINTER_DEFAULT_VARIANT_ID,
  findPointerVariantById,
  pointersPack,
} from '@outside/resource-packs/pointers/meta';
import { generateDungeon } from '../../utils/dungeonLayout';
import { generateDungeonWFC } from '../../utils/dungeonLayoutWFC';
import { generateDungeonMetaTiles } from '../../utils/metatileDungeon';

/**
 * Spawns count bots in a follow chain: first is leader (Wander), rest Follow previous.
 */
export function spawnFollowChain(world: SimulatorWorld, _seed: number, count: number): void {
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

function pickFoodVariant(seed: number, index: number): FoodVariantId {
  const variants = foodVariantIds;
  const variantIndex =
    Math.floor(seededUnit(seed, 7000 + index) * variants.length) % variants.length;
  return variants[Math.max(0, variantIndex)] as FoodVariantId;
}

interface DynamicSpawnOptions {
  botCount?: number;
  foodCount?: number;
  dogCount?: number;
  catCount?: number;
  ballCount?: number;
  ballBounciness?: number;
  actorSelection?: ActorZooSelection;
  actorAct?: ActorZooAct;
  actorPace?: ActorZooPace;
  pointerVariant?: string;
}

export const ACTOR_ZOO_ALL_OPTION = 'all';
export const ACTOR_ZOO_ACT_OPTIONS = [
  'idle',
  'wander',
  'rotate',
  'jump',
  'follow',
  'follow-mouse',
] as const;
export const ACTOR_ZOO_PACE_OPTIONS = ['walkSlow', 'walk', 'run', 'runFast'] as const;
export type ActorZooAct = (typeof ACTOR_ZOO_ACT_OPTIONS)[number];
export type ActorZooPace = (typeof ACTOR_ZOO_PACE_OPTIONS)[number];

export const ACTOR_ZOO_VARIANTS = [
  {
    id: 'actor.bot',
    label: 'Bot',
    variantSpriteKey: '',
  },
  {
    id: 'actor.bot.golden-retriever',
    label: 'Golden Retriever',
    variantSpriteKey: GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
  },
  {
    id: 'actor.bot.beige-cat',
    label: 'Beige Cat',
    variantSpriteKey: BEIGE_CAT_BOT_SPRITE_KEY,
  },
] as const;

export type ActorZooVariantId = (typeof ACTOR_ZOO_VARIANTS)[number]['id'];
export type ActorZooSelection = ActorZooVariantId | typeof ACTOR_ZOO_ALL_OPTION;

const ACTOR_ZOO_DEFAULT_SELECTION: ActorZooSelection = ACTOR_ZOO_ALL_OPTION;
const ACTOR_ZOO_DEFAULT_ACT: ActorZooAct = 'idle';
const ACTOR_ZOO_DEFAULT_PACE: ActorZooPace = 'walk';
const ACTOR_ZOO_PER_ACTOR_PADDING_TILES = 4;
const ACTOR_ZOO_INNER_PADDING_TILES = 4;
const ACTOR_ZOO_ROW_HEIGHT_TILES = 1 + ACTOR_ZOO_PER_ACTOR_PADDING_TILES * 2;
const ACTOR_ZOO_SLOT_WIDTH_TILES = ACTOR_ZOO_ROW_HEIGHT_TILES;
const ACTOR_ZOO_WALK_SPEED_TPS = 2.4;
const ACTOR_ZOO_RUN_SPEED_TPS = 5.2;
const SOUTH_DIRECTION_RAD = Math.PI / 2;
const BOT_JUMP_HEIGHT_SCALE = 1;
const DOG_JUMP_HEIGHT_SCALE = 0.75;
const CAT_JUMP_HEIGHT_SCALE = 1.5;
const BOT_JUMP_SPEED_BOOST = 0.7;
const CAT_JUMP_SPEED_BOOST = 1.1;
const BOT_SPEED_MULTIPLIER = 1;
const DOG_SPEED_MULTIPLIER = 1.25;
const CAT_SPEED_MULTIPLIER = 1.5;

export const POINTER_ZOO_VARIANTS = pointersPack.pointers.map((pointer) => ({
  id: pointer.spriteKey,
  label: pointer.displayName,
}));
export const POINTER_ZOO_DEFAULT_POINTER_SPRITE_KEY =
  findPointerVariantById(POINTER_DEFAULT_VARIANT_ID)?.spriteKey ?? 'ui.cursor.r0c0';
const POINTER_ZOO_CELL_SPACING_TILES = 2;
const POINTER_ZOO_INNER_PADDING_TILES = 2;

function jumpHeightScaleForVariant(variantId: ActorZooVariantId): number {
  if (variantId === 'actor.bot.golden-retriever') return DOG_JUMP_HEIGHT_SCALE;
  if (variantId === 'actor.bot.beige-cat') return CAT_JUMP_HEIGHT_SCALE;
  return BOT_JUMP_HEIGHT_SCALE;
}

function jumpSpeedBoostForVariant(variantId: ActorZooVariantId): number {
  if (variantId === 'actor.bot.beige-cat') return CAT_JUMP_SPEED_BOOST;
  return BOT_JUMP_SPEED_BOOST;
}

function speedMultiplierForVariant(variantId: ActorZooVariantId): number {
  if (variantId === 'actor.bot.golden-retriever') return DOG_SPEED_MULTIPLIER;
  if (variantId === 'actor.bot.beige-cat') return CAT_SPEED_MULTIPLIER;
  return BOT_SPEED_MULTIPLIER;
}

function speedForZooPace(pace: ActorZooPace): number {
  if (pace === 'walkSlow') return ACTOR_ZOO_WALK_SPEED_TPS * 0.5;
  if (pace === 'runFast') return ACTOR_ZOO_WALK_SPEED_TPS * 2;
  if (pace === 'run') return ACTOR_ZOO_RUN_SPEED_TPS;
  return ACTOR_ZOO_WALK_SPEED_TPS;
}

function getActorZooVariants(
  selection: ActorZooSelection
): ReadonlyArray<(typeof ACTOR_ZOO_VARIANTS)[number]> {
  if (selection === ACTOR_ZOO_ALL_OPTION) {
    return ACTOR_ZOO_VARIANTS;
  }
  return ACTOR_ZOO_VARIANTS.filter((variant) => variant.id === selection);
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
export function spawnBotsInWorld(world: SimulatorWorld, seed: number, entityCount: number): void {
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
 * Spawns a dynamic "zoo" room containing one row of actor prefabs.
 * Room dimensions scale with the number of showcased actors.
 */
export function spawnActorZoo(
  world: SimulatorWorld,
  _seed: number,
  _entityCount: number,
  spawnOptions?: DynamicSpawnOptions
): void {
  const selection = (spawnOptions?.actorSelection ??
    ACTOR_ZOO_DEFAULT_SELECTION) as ActorZooSelection;
  const act = (spawnOptions?.actorAct ?? ACTOR_ZOO_DEFAULT_ACT) as ActorZooAct;
  const pace = (spawnOptions?.actorPace ?? ACTOR_ZOO_DEFAULT_PACE) as ActorZooPace;
  const variants = getActorZooVariants(selection);
  if (variants.length === 0) return;

  const roomWidth =
    ACTOR_ZOO_INNER_PADDING_TILES * 2 + variants.length * ACTOR_ZOO_SLOT_WIDTH_TILES;
  const roomHeight = ACTOR_ZOO_INNER_PADDING_TILES * 2 + ACTOR_ZOO_ROW_HEIGHT_TILES;
  const xMin = -Math.floor(roomWidth / 2);
  const yMin = -Math.floor(roomHeight / 2);
  const xMax = xMin + roomWidth - 1;
  const yMax = yMin + roomHeight - 1;

  spawnFloorRect(world, xMin, yMin, xMax, yMax, true);
  for (let x = xMin - 1; x <= xMax + 1; x++) {
    spawnWall(world, x, yMin - 1);
    spawnWall(world, x, yMax + 1);
  }
  for (let y = yMin; y <= yMax; y++) {
    spawnWall(world, xMin - 1, y);
    spawnWall(world, xMax + 1, y);
  }

  const rowY = yMin + ACTOR_ZOO_INNER_PADDING_TILES + Math.floor(ACTOR_ZOO_ROW_HEIGHT_TILES / 2) + 0.5;
  const paceSpeed = speedForZooPace(pace);
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const rowX =
      xMin +
      ACTOR_ZOO_INNER_PADDING_TILES +
      i * ACTOR_ZOO_SLOT_WIDTH_TILES +
      Math.floor(ACTOR_ZOO_SLOT_WIDTH_TILES / 2) +
      0.5;
    const eid = spawnBot(world, {
      x: rowX,
      y: rowY,
      directionRad: SOUTH_DIRECTION_RAD,
      urge: act === 'wander' ? 'wander' : 'wait',
      walkingSpeedTps: paceSpeed * speedMultiplierForVariant(variant.id),
      runningSpeedTps: paceSpeed * speedMultiplierForVariant(variant.id),
      variantSpriteKey: variant.variantSpriteKey,
    });
    addComponent(world, eid, FollowStopRange);
    setComponent(world, eid, FollowStopRange, { tiles: 2 });
    addComponent(world, eid, JumpHeightScale);
    setComponent(world, eid, JumpHeightScale, {
      value: jumpHeightScaleForVariant(variant.id),
    });
    addComponent(world, eid, SpeedBoostOnJump);
    setComponent(world, eid, SpeedBoostOnJump, {
      tilesPerSec: jumpSpeedBoostForVariant(variant.id),
    });
    if (act === 'idle') {
      setComponent(world, eid, TargetPace, { value: TARGET_PACE_STANDING_STILL });
    }
  }
}

/**
 * Spawns a compact square "pointer zoo" with one cursor variant per tile in a grid.
 * Clicking a pointer tile can promote that sprite as the active custom pointer.
 */
export function spawnPointerZoo(
  world: SimulatorWorld,
  _seed: number,
  _entityCount: number,
  spawnOptions?: DynamicSpawnOptions
): void {
  const columns = Math.max(1, pointersPack.layout.columns);
  const rows = Math.max(1, pointersPack.layout.rows);
  const roomInnerSize =
    Math.max(columns, rows) * POINTER_ZOO_CELL_SPACING_TILES + POINTER_ZOO_INNER_PADDING_TILES * 2;
  const xMin = -Math.floor(roomInnerSize / 2);
  const yMin = -Math.floor(roomInnerSize / 2);
  const xMax = xMin + roomInnerSize - 1;
  const yMax = yMin + roomInnerSize - 1;

  spawnFloorRect(world, xMin, yMin, xMax, yMax, true);
  for (let x = xMin - 1; x <= xMax + 1; x++) {
    spawnWall(world, x, yMin - 1);
    spawnWall(world, x, yMax + 1);
  }
  for (let y = yMin; y <= yMax; y++) {
    spawnWall(world, xMin - 1, y);
    spawnWall(world, xMax + 1, y);
  }

  const startX = xMin + POINTER_ZOO_INNER_PADDING_TILES + 0.5;
  const startY = yMax - POINTER_ZOO_INNER_PADDING_TILES + 0.5;
  for (let i = 0; i < pointersPack.pointers.length; i++) {
    const pointer = pointersPack.pointers[i];
    const row = Math.floor(i / columns);
    const col = i % columns;
    const x = startX + col * POINTER_ZOO_CELL_SPACING_TILES;
    const y = startY - row * POINTER_ZOO_CELL_SPACING_TILES;
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Observed);
    addComponent(world, eid, DefaultSpriteKey);
    addComponent(world, eid, PointerKind);
    setComponent(world, eid, Position, { x, y });
    setComponent(world, eid, PointerKind, { value: pointer.spriteKey });
    DefaultSpriteKey.value[eid] = pointer.spriteKey;
  }

  setPointerSpriteKey(
    world,
    spawnOptions?.pointerVariant?.trim() || POINTER_ZOO_DEFAULT_POINTER_SPRITE_KEY
  );
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

function pickRoomCell(
  roomCells: Array<{ x: number; y: number }>,
  seed: number,
  salt: number,
  blockedCells?: ReadonlySet<string>
): { x: number; y: number } {
  const startIndex = Math.floor(seededUnit(seed, salt) * roomCells.length) % roomCells.length;
  if (blockedCells == null || blockedCells.size === 0) {
    return roomCells[startIndex];
  }
  for (let i = 0; i < roomCells.length; i++) {
    const idx = (startIndex + i) % roomCells.length;
    const candidate = roomCells[idx];
    if (!blockedCells.has(key(candidate.x, candidate.y))) {
      return candidate;
    }
  }
  return roomCells[startIndex];
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
  const adjacentOffsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    // Include diagonals so room corners are enclosed by walls.
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!grid[x][y]) continue;
      for (const [dx, dy] of adjacentOffsets) {
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
    const idx = Math.floor(seededUnit(seed, i) * roomCells.length) % roomCells.length;
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
    const idx = Math.floor(seededUnit(seed, 1000 + i) * roomCells.length) % roomCells.length;
    const p = roomCells[idx];
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnFood(world, { x, y, variant: pickFoodVariant(seed, i) });
  }
}

/**
 * WFC-generated dungeon (rooms + organic layout). Same layout and spawn logic as spawnDungeonThenScattered but uses generateDungeonWFC.
 */
export function spawnDungeonWFCThenScattered(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  const width = 80;
  const height = 50;
  const offsetX = -width / 2;
  const offsetY = -height / 2;
  const { grid, roomCells } = generateDungeonWFC(width, height, seed);
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
    const idx = Math.floor(seededUnit(seed, i) * roomCells.length) % roomCells.length;
    const p = roomCells[idx];
    const cx = p.x + offsetX + 0.5;
    const cy = p.y + offsetY + 0.5;
    const angle = seededUnit(seed, i * 2) * Math.PI * 2;
    spawnBot(world, {
      x: cx,
      y: cy,
      directionRad: angle,
      urge: 'wander',
      variantSpriteKey: GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
    });
  }
}

/**
 * WFC dungeon plus food. Same as spawnDungeonWithFood but uses WFC generator.
 */
export function spawnDungeonWFCWithFood(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  spawnDungeonWFCThenScattered(world, seed, entityCount);
  const { roomCells } = generateDungeonWFC(80, 50, seed);
  if (roomCells.length === 0) return;
  const offsetX = -40;
  const offsetY = -25;
  for (let i = 0; i < DUNGEON_FOOD_COUNT; i++) {
    const idx = Math.floor(seededUnit(seed, 1000 + i) * roomCells.length) % roomCells.length;
    const p = roomCells[idx];
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnFood(world, { x, y, variant: pickFoodVariant(seed, 100 + i) });
  }
}

/** Dog count for dungeon-with-hero preset. */
const DUNGEON_HERO_DOG_COUNT = 0;
/** Cat count for dungeon-with-hero preset. */
const DUNGEON_HERO_CAT_COUNT = 0;

function spawnDungeonActorVariants(
  world: SimulatorWorld,
  seed: number,
  roomCells: Array<{ x: number; y: number }>,
  offsetX: number,
  offsetY: number,
  spawnOptions: DynamicSpawnOptions | undefined,
  fallbackBotCount: number,
  blockedCells?: ReadonlySet<string>
): Array<{ x: number; y: number }> {
  const resolvedBotCount = Math.max(0, Math.floor(spawnOptions?.botCount ?? fallbackBotCount));
  const resolvedDogCount = Math.max(
    0,
    Math.floor(spawnOptions?.dogCount ?? DUNGEON_HERO_DOG_COUNT)
  );
  const resolvedCatCount = Math.max(
    0,
    Math.floor(spawnOptions?.catCount ?? DUNGEON_HERO_CAT_COUNT)
  );
  const spawnedPositions: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < resolvedBotCount; i++) {
    const p = pickRoomCell(roomCells, seed, 3000 + i, blockedCells);
    const cx = p.x + offsetX + 0.5;
    const cy = p.y + offsetY + 0.5;
    const angle = seededUnit(seed, 4000 + i * 2) * Math.PI * 2;
    spawnBot(world, {
      x: cx,
      y: cy,
      directionRad: angle,
      urge: 'wander',
    });
    spawnedPositions.push({ x: cx, y: cy });
  }

  for (let i = 0; i < resolvedDogCount; i++) {
    const p = pickRoomCell(roomCells, seed, 5000 + i, blockedCells);
    const cx = p.x + offsetX + 0.5;
    const cy = p.y + offsetY + 0.5;
    const angle = seededUnit(seed, 6000 + i * 2) * Math.PI * 2;
    spawnBot(world, {
      x: cx,
      y: cy,
      directionRad: angle,
      urge: 'wander',
      variantSpriteKey: GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
    });
    spawnedPositions.push({ x: cx, y: cy });
  }

  for (let i = 0; i < resolvedCatCount; i++) {
    const p = pickRoomCell(roomCells, seed, 7000 + i, blockedCells);
    const cx = p.x + offsetX + 0.5;
    const cy = p.y + offsetY + 0.5;
    const angle = seededUnit(seed, 8000 + i * 2) * Math.PI * 2;
    spawnBot(world, {
      x: cx,
      y: cy,
      directionRad: angle,
      urge: 'wander',
      variantSpriteKey: BEIGE_CAT_BOT_SPRITE_KEY,
    });
    spawnedPositions.push({ x: cx, y: cy });
  }
  return spawnedPositions;
}

function offsetFoodFromActor(seed: number, index: number): { x: number; y: number } {
  const angle = seededUnit(seed, 9000 + index) * Math.PI * 2;
  // Keep food close enough to be found quickly, but far enough to avoid instant overlap.
  const radius = 1.25;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/**
 * WFC dungeon with configurable food/bot counts and hero.
 * Same as spawnDungeonWithFoodAndHero but uses WFC generator.
 */
export function spawnDungeonWFCWithFoodAndHero(
  world: SimulatorWorld,
  seed: number,
  botCount: number,
  spawnOptions?: DynamicSpawnOptions
): void {
  const width = 80;
  const height = 50;
  const offsetX = -width / 2;
  const offsetY = -height / 2;
  const { grid, roomCells } = generateDungeonWFC(width, height, seed);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (grid[x][y]) {
        spawnFloorTile(world, x + offsetX, y + offsetY, true);
      }
    }
  }
  spawnWallsAroundFloor(world, grid, width, height, offsetX, offsetY);
  if (roomCells.length === 0) return;
  const heroCell = pickRoomCell(roomCells, seed, 2000);
  const heroCellKey = key(heroCell.x, heroCell.y);
  const blockedHeroCellSet = new Set([heroCellKey]);
  const heroX = heroCell.x + offsetX + 0.5;
  const heroY = heroCell.y + offsetY + 0.5;
  const heroEid = spawnHero(world, {
    x: heroX,
    y: heroY,
    variantSpriteKey: GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
  });
  setViewportFollowTarget(world, heroEid);
  const resolvedFoodCount = Math.max(
    0,
    Math.floor(spawnOptions?.foodCount ?? DUNGEON_HERO_FOOD_COUNT)
  );
  const actorPositions = spawnDungeonActorVariants(
    world,
    seed,
    roomCells,
    offsetX,
    offsetY,
    spawnOptions,
    botCount,
    blockedHeroCellSet
  );
  const anchoredFoodCount = Math.min(3, actorPositions.length, resolvedFoodCount);
  for (let i = 0; i < anchoredFoodCount; i++) {
    const anchor = actorPositions[i];
    const offset = offsetFoodFromActor(seed, 200 + i);
    spawnFood(world, {
      x: anchor.x + offset.x,
      y: anchor.y + offset.y,
      variant: pickFoodVariant(seed, 200 + i),
    });
  }
  for (let i = anchoredFoodCount; i < resolvedFoodCount; i++) {
    const p = pickRoomCell(roomCells, seed, 1000 + i, blockedHeroCellSet);
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnFood(world, { x, y, variant: pickFoodVariant(seed, 200 + i) });
  }
}

/** Food count for dungeon-with-hero preset. */
const DUNGEON_HERO_FOOD_COUNT = 12;
const DUNGEON_SOCCER_BALL_COUNT = 4;

/**
 * Dungeon layout with configurable food/bot counts and 1 hero. Camera follows the hero.
 * Click floor tiles to order the hero there; path uses line-of-sight simplification.
 */
export function spawnDungeonWithFoodAndHero(
  world: SimulatorWorld,
  seed: number,
  botCount: number,
  spawnOptions?: DynamicSpawnOptions
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
  const heroCell = pickRoomCell(roomCells, seed, 2000);
  const heroCellKey = key(heroCell.x, heroCell.y);
  const blockedHeroCellSet = new Set([heroCellKey]);
  const heroX = heroCell.x + offsetX + 0.5;
  const heroY = heroCell.y + offsetY + 0.5;
  const heroEid = spawnHero(world, {
    x: heroX,
    y: heroY,
    variantSpriteKey: GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
  });
  setViewportFollowTarget(world, heroEid);
  const resolvedFoodCount = Math.max(
    0,
    Math.floor(spawnOptions?.foodCount ?? DUNGEON_HERO_FOOD_COUNT)
  );
  const actorPositions = spawnDungeonActorVariants(
    world,
    seed,
    roomCells,
    offsetX,
    offsetY,
    spawnOptions,
    botCount,
    blockedHeroCellSet
  );
  const anchoredFoodCount = Math.min(3, actorPositions.length, resolvedFoodCount);
  for (let i = 0; i < anchoredFoodCount; i++) {
    const anchor = actorPositions[i];
    const offset = offsetFoodFromActor(seed, 300 + i);
    spawnFood(world, {
      x: anchor.x + offset.x,
      y: anchor.y + offset.y,
      variant: pickFoodVariant(seed, 300 + i),
    });
  }
  for (let i = anchoredFoodCount; i < resolvedFoodCount; i++) {
    const p = pickRoomCell(roomCells, seed, 1000 + i, blockedHeroCellSet);
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnFood(world, { x, y, variant: pickFoodVariant(seed, 300 + i) });
  }
}

/**
 * Dungeon layout with configurable bots and soccer balls.
 * Intended for early soccer-ball interaction validation.
 */
export function spawnDungeonWithSoccerBalls(
  world: SimulatorWorld,
  seed: number,
  botCount: number,
  spawnOptions?: DynamicSpawnOptions
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

  spawnDungeonActorVariants(world, seed, roomCells, offsetX, offsetY, spawnOptions, botCount);
  const resolvedBallCount = Math.max(
    0,
    Math.floor(spawnOptions?.ballCount ?? DUNGEON_SOCCER_BALL_COUNT)
  );
  for (let i = 0; i < resolvedBallCount; i++) {
    const p = pickRoomCell(roomCells, seed, 12000 + i);
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnSoccerBall(world, {
      x,
      y,
      bounciness: spawnOptions?.ballBounciness ?? 0.82,
    });
  }
}

/**
 * Dungeon layout with soccer balls and one controllable hero (dog variant).
 * Camera follows hero so click-to-move interaction matches other hero stories.
 */
export function spawnDungeonWithSoccerBallsAndHero(
  world: SimulatorWorld,
  seed: number,
  botCount: number,
  spawnOptions?: DynamicSpawnOptions
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

  const heroCell = pickRoomCell(roomCells, seed, 2000);
  const heroCellKey = key(heroCell.x, heroCell.y);
  const blockedHeroCellSet = new Set([heroCellKey]);
  const heroX = heroCell.x + offsetX + 0.5;
  const heroY = heroCell.y + offsetY + 0.5;
  const heroEid = spawnHero(world, {
    x: heroX,
    y: heroY,
    variantSpriteKey: GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
  });
  setViewportFollowTarget(world, heroEid);

  spawnDungeonActorVariants(
    world,
    seed,
    roomCells,
    offsetX,
    offsetY,
    spawnOptions,
    botCount,
    blockedHeroCellSet
  );

  const resolvedBallCount = Math.max(
    0,
    Math.floor(spawnOptions?.ballCount ?? DUNGEON_SOCCER_BALL_COUNT)
  );
  for (let i = 0; i < resolvedBallCount; i++) {
    const p = pickRoomCell(roomCells, seed, 12000 + i, blockedHeroCellSet);
    const x = p.x + offsetX + 0.5;
    const y = p.y + offsetY + 0.5;
    spawnSoccerBall(world, {
      x,
      y,
      bounciness: spawnOptions?.ballBounciness ?? 0.82,
    });
  }
}

/**
 * Creates a spawn function that generates a MetaTile dungeon (16×16 tiles per metatile).
 * Uses grid + wallGrid: Floor and Wall are placed explicitly; Empty cells get no entity.
 * Default 5×5 metatiles = 80×80 tiles; use metaWidth/metaHeight for controls.
 */
export function createMetaTileDungeonSpawn(
  metaWidth: number,
  metaHeight: number
): (world: SimulatorWorld, seed: number, entityCount: number) => void {
  return (world, seed, entityCount) => {
    const { grid, roomCells, wallGrid } = generateDungeonMetaTiles(metaWidth, metaHeight, seed);
    const width = grid.length;
    const height = grid[0].length;
    const offsetX = -width / 2;
    const offsetY = -height / 2;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (grid[x][y]) {
          spawnFloorTile(world, x + offsetX, y + offsetY, true);
        } else if (wallGrid[x][y]) {
          spawnWall(world, x + offsetX, y + offsetY);
        }
      }
    }
    if (roomCells.length === 0) return;
    for (let i = 0; i < entityCount; i++) {
      const idx = Math.floor(seededUnit(seed, i) * roomCells.length) % roomCells.length;
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
  };
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
