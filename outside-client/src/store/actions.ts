import { WorldState, GameObject, Position, Direction, TerrainType } from '@outside/core';

/**
 * Action types for the Flux store
 */
export type Action =
  | { type: 'CREATE_BOT'; payload: { id: string } }
  | { type: 'CREATE_TERRAIN'; payload: { id: string; terrainType: TerrainType; x: number; y: number; width: number; height: number } }
  | { type: 'PLACE_OBJECT'; payload: { id: string; position: Position } }
  | { type: 'MOVE_OBJECT'; payload: { id: string; direction: Direction; distance: number } }
  | { type: 'SET_WORLD_STATE'; payload: { worldState: WorldState } };

/**
 * Action creators
 */
export const actions = {
  createBot: (id: string): Action => ({
    type: 'CREATE_BOT',
    payload: { id },
  }),

  createTerrain: (id: string, terrainType: TerrainType, x: number, y: number, width: number, height: number): Action => ({
    type: 'CREATE_TERRAIN',
    payload: { id, terrainType, x, y, width, height },
  }),

  placeObject: (id: string, position: Position): Action => ({
    type: 'PLACE_OBJECT',
    payload: { id, position },
  }),

  moveObject: (id: string, direction: Direction, distance: number): Action => ({
    type: 'MOVE_OBJECT',
    payload: { id, direction, distance },
  }),

  setWorldState: (worldState: WorldState): Action => ({
    type: 'SET_WORLD_STATE',
    payload: { worldState },
  }),
};
