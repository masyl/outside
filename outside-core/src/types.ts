/**
 * Core types for the Outside game
 */

export type Position = {
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

export interface GameObject {
  id: string;
  type: ObjectType;
  position?: Position; // Optional - bots can exist without a position until placed
  facing?: Direction; // Optional facing direction
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
  width: number;
  height: number;
  seed: number; // Master seed for RNG
}
