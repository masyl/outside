/**
 * Core types for the Outside game
 */

export type Position = {
  x: number;
  y: number;
};

/**
 * Semantics-only aliases (same shape, different intent).
 *
 * - TilePosition: integer tile coordinates (grid indexing, collisions, terrain lookup)
 * - WorldPosition: continuous coordinates in tile units (rendering + continuous motion)
 */
export type TilePosition = Position;
export type WorldPosition = Position;

/**
 * Velocity in tiles per second, in world coordinates.
 */
export type Velocity = {
  x: number;
  y: number;
};

export type Direction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';

export type ObjectType = 'bot';

/**
 * Continuous motion state for bots.
 *
 * Stored on the entity so simulation ticks are deterministic/replayable.
 */
export interface BotMotionState {
  headingRad: number;
  angularVelocityRadPerSec: number;
  speedTilesPerSec: number;
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position?: WorldPosition; // Optional - bots can exist without a position until placed
  velocity?: Velocity; // Optional - continuous velocity in tiles/sec
  motion?: BotMotionState; // Optional - internal motion state for deterministic simulation
  facing?: Direction; // Optional facing direction (typically derived from velocity)
}

export interface Bot extends GameObject {
  type: 'bot';
}

export type Grid = (GameObject | null)[][];

export type TerrainType = 'grass' | 'dirt' | 'water' | 'sand' | 'hole';

export interface TerrainObject {
  id: string;
  type: TerrainType;
  position: Position;
  width: number;
  height: number;
  createdAt: number; // Timestamp for stacking order
}

export interface GroundLayer {
  terrainObjects: Map<string, TerrainObject>;
  terrainObjectsByPosition: Map<string, TerrainObject[]>; // "x,y" -> [TerrainObject]
}

export interface WorldState {
  grid: Grid; // Surface layer (existing)
  objects: Map<string, GameObject>; // Surface layer objects (existing)
  groundLayer: GroundLayer; // New ground layer
  horizontalLimit: number; // Tiles from -limit to +limit on X axis
  verticalLimit: number; // Tiles from -limit to +limit on Y axis
  seed: number; // Master seed for RNG
  timeMs: number; // Deterministic simulation time
}
