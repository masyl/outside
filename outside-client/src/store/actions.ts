import { WorldState, Position, Direction, TerrainType, type BotUrgeState, type Urge } from '@outside/core';

export type Action =
  | { type: 'CREATE_BOT'; payload: { id: string } }
  | {
      type: 'CREATE_TERRAIN';
      payload: {
        id: string;
        terrainType: TerrainType;
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | { type: 'PLACE_OBJECT'; payload: { id: string; position: Position } }
  | {
      type: 'MOVE_OBJECT';
      payload: { id: string; direction: Direction; distance: number; originalValue?: Position };
    }
  | { type: 'SIM_TICK'; payload: { dtMs: number } }
  | {
      type: 'SET_BOT_URGE';
      payload: { id: string; urge: Urge; followTargetId?: string; tightness?: number };
    }
  | { type: 'SET_WORLD_SIZE'; payload: { horizontalLimit: number; verticalLimit: number } }
  | { type: 'SET_SEED'; payload: { seed: number } }
  | { type: 'RESET_WORLD' }
  | { type: 'SET_WORLD_STATE'; payload: { worldState: WorldState | null } };

export const actions = {
  createBot: (id: string): Action => ({
    type: 'CREATE_BOT',
    payload: { id },
  }),

  createTerrain: (
    id: string,
    terrainType: TerrainType,
    x: number,
    y: number,
    width: number,
    height: number
  ): Action => ({
    type: 'CREATE_TERRAIN',
    payload: { id, terrainType, x, y, width, height },
  }),

  placeObject: (id: string, position: Position): Action => ({
    type: 'PLACE_OBJECT',
    payload: { id, position },
  }),

  moveObject: (
    id: string,
    direction: Direction,
    distance: number,
    originalValue?: Position
  ): Action => ({
    type: 'MOVE_OBJECT',
    payload: { id, direction, distance, originalValue },
  }),

  simTick: (dtMs: number): Action => ({
    type: 'SIM_TICK',
    payload: { dtMs },
  }),

  setBotUrge: (id: string, urge: Urge, opts?: Partial<BotUrgeState>): Action => ({
    type: 'SET_BOT_URGE',
    payload: {
      id,
      urge,
      followTargetId: opts?.followTargetId,
      tightness: opts?.tightness,
    },
  }),

  setWorldSize: (horizontalLimit: number, verticalLimit: number): Action => ({
    type: 'SET_WORLD_SIZE',
    payload: { horizontalLimit, verticalLimit },
  }),

  setSeed: (seed: number): Action => ({
    type: 'SET_SEED',
    payload: { seed },
  }),

  resetWorld: (): Action => ({
    type: 'RESET_WORLD',
  }),

  setWorldState: (worldState: WorldState): Action => ({
    type: 'SET_WORLD_STATE',
    payload: { worldState },
  }),
};
