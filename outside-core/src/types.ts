/**
 * Core types for the Outside game
 */

export type Position = {
  x: number;
  y: number;
};

export type Direction = 'left' | 'right' | 'up' | 'down';

export type ObjectType = 'bot';

export interface GameObject {
  id: string;
  type: ObjectType;
  position: Position;
}

export interface Bot extends GameObject {
  type: 'bot';
}

export type Grid = (GameObject | null)[][];

export interface WorldState {
  grid: Grid;
  objects: Map<string, GameObject>;
  width: number;
  height: number;
}
