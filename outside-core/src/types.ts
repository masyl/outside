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

/**
 * High-level autonomy intent for a bot.
 *
 * This is stored in simulation state so Timeline replay/time-travel remains deterministic.
 */
export type Urge = 'wander' | 'follow' | 'wait';

/**
 * Per-bot urge state.
 *
 * Notes:
 * - `followTargetId` is an entity id (another bot for now).
 * - Parameters are optional so we can introduce defaults incrementally.
 */
export interface BotUrgeState {
  urge: Urge;
  followTargetId?: string;
  // TODO: This "tightness"attribute is too generic and could cause ambiguity.
  // Its name should be specific to the context of the following urge and/or follow target.
  tightness?: number;
}

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

// TODO: The GameObject should be renamed to GameEntity to avoid too much distance from the
// ECS terminology..
export interface GameObject {
  id: string;
  type: ObjectType;
  position?: WorldPosition; // Optional - bots can exist without a position until placed
  velocity?: Velocity; // Optional - continuous velocity in tiles/sec
  // TODO: Remove the Bot prefixes everywhere. This is not a terminology compatible with
  // the ECS Pattern.
  motion?: BotMotionState; // Optional - internal motion state for deterministic simulation
  urge?: BotUrgeState; // Optional - autonomy intent (defaults applied in reducer)
  facing?: Direction; // Optional facing direction (typically derived from velocity)
}

// TODO: The need for a specific Bot class should be refactored out and rely on
// configurations instead.
export interface Bot extends GameObject {
  type: 'bot';
}

export type Grid = (GameObject | null)[][];

// TODO: TerrainTypes and TerrainObject should be refactored to be a configurated entity with
// the proper systems attached to it.
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
  //TODO: This should be refactored to use the ECS Pattern instead of a
  // simple map. It is too specific.
  objects: Map<string, GameObject>; // Surface layer objects (existing)
  groundLayer: GroundLayer; // New ground layer
  // TODO: Terrain Limits should be implemented with the ECS Pattern.
  horizontalLimit: number; // Tiles from -limit to +limit on X axis
  verticalLimit: number; // Tiles from -limit to +limit on Y axis
  seed: number; // Master seed for RNG
  timeMs: number; // Deterministic simulation time
}
