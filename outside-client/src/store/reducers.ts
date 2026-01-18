import { produce } from 'immer';
import {
  WorldState,
  Bot,
  Position,
  Direction,
  TerrainObject,
  isValidPosition,
  isPositionOccupied,
  placeObjectInGrid,
  removeObjectFromGrid,
  addTerrainObject,
  isWalkable,
  getTopMostTerrainAtPosition,
  createWorldState,
} from '@outside/core';
import { Action } from './actions';

/**
 * Reducer function that handles state updates using Immer
 */
export function reducer(state: WorldState, action: Action): WorldState {
  // Special case for SET_WORLD_STATE - bypass immer
  if (action.type === 'SET_WORLD_STATE') {
    return action.payload.worldState || state;
  }

  return produce(state, (draft) => {
    switch (action.type) {
      case 'CREATE_BOT': {
        const { id } = action.payload;

        // Check if object already exists
        if (draft.objects.has(id)) {
          console.warn(`Object with id "${id}" already exists`);
          return state;
        }

        // Create new bot
        const bot: Bot = {
          id,
          type: 'bot',
          position: { x: 0, y: 0 }, // Default position, will be placed later
        };

        draft.objects.set(id, bot);
        break;
      }

      case 'CREATE_TERRAIN': {
        const { id, terrainType, x, y, width, height } = action.payload;

        // Check if terrain already exists
        if (draft.groundLayer.terrainObjects.has(id)) {
          console.warn(`Terrain with id "${id}" already exists`);
          return state;
        }

        // Validate terrain bounds
        // Terrain must be fully within the grid: x + width <= width, y + height <= height
        if (x < 0 || y < 0 || x + width > draft.width || y + height > draft.height) {
          console.warn(
            `Terrain extends outside world bounds: (${x}, ${y}) ${width}x${height}, world size: ${draft.width}x${draft.height}`
          );
          return state;
        }

        // Additional validation: ensure width and height are positive
        if (width <= 0 || height <= 0) {
          console.warn(`Terrain has invalid dimensions: ${width}x${height}`);
          return state;
        }

        // Create new terrain object with current timestamp
        const terrain: TerrainObject = {
          id,
          type: terrainType,
          position: { x, y },
          width,
          height,
          createdAt: Date.now(),
        };

        // console.log(`[CREATE_TERRAIN] Creating terrain: ${id} (${terrainType}) at (${x}, ${y}) size ${width}x${height}`);

        // Add to ground layer
        addTerrainObject(draft.groundLayer, terrain);

        // console.log(`[CREATE_TERRAIN] Terrain added. Total terrain objects: ${draft.groundLayer.terrainObjects.size}`);
        break;
      }

      case 'PLACE_OBJECT': {
        const { id, position } = action.payload;

        const object = draft.objects.get(id);
        if (!object) {
          console.warn(`Object with id "${id}" not found`);
          return state;
        }

        if (!isValidPosition(draft, position)) {
          console.warn(`Invalid position: (${position.x}, ${position.y})`);
          return state;
        }

        // Check walkability - bots can only be placed on walkable terrain
        // console.log(`[PLACE_OBJECT] Trying to place ${id} at (${position.x}, ${position.y})`);
        if (!isWalkable(draft, position)) {
          const topMostTerrain = getTopMostTerrainAtPosition(draft.groundLayer, position);
          if (topMostTerrain) {
            console.warn(
              `[PLACE_OBJECT] Position (${position.x}, ${position.y}) is not walkable - terrain: ${topMostTerrain.type} (${topMostTerrain.id})`
            );
          } else {
            console.warn(
              `[PLACE_OBJECT] Position (${position.x}, ${position.y}) is not walkable - NO TERRAIN at this position`
            );
          }
          return state;
        }

        const topMostTerrain = getTopMostTerrainAtPosition(draft.groundLayer, position);
        if (topMostTerrain) {
          // console.log(`[PLACE_OBJECT] Position (${position.x}, ${position.y}) is walkable - terrain: ${topMostTerrain.type} (${topMostTerrain.id})`);
        } else {
          // console.log(`[PLACE_OBJECT] Position (${position.x}, ${position.y}) is walkable - NO TERRAIN (should not happen)`);
        }

        // Check if target position is occupied by another object
        if (isPositionOccupied(draft, position)) {
          console.warn(`Position (${position.x}, ${position.y}) is occupied`);
          return state;
        }

        // Remove object from old position
        if (object.position) {
          removeObjectFromGrid(draft.grid, object.position);
        }

        // Place object at new position
        object.position = position;
        placeObjectInGrid(draft.grid, object, position);
        break;
      }

      case 'MOVE_OBJECT': {
        const { id, direction, distance } = action.payload;

        const object = draft.objects.get(id);
        if (!object) {
          console.warn(`Object with id "${id}" not found`);
          return state;
        }

        const currentPos = object.position;
        let newPosition: Position = { ...currentPos };

        // Calculate new position based on direction
        switch (direction) {
          case 'left':
            newPosition.x -= distance;
            break;
          case 'right':
            newPosition.x += distance;
            break;
          case 'up':
            newPosition.y -= distance;
            break;
          case 'down':
            newPosition.y += distance;
            break;
          case 'up-left':
            newPosition.x -= distance;
            newPosition.y -= distance;
            break;
          case 'up-right':
            newPosition.x += distance;
            newPosition.y -= distance;
            break;
          case 'down-left':
            newPosition.x -= distance;
            newPosition.y += distance;
            break;
          case 'down-right':
            newPosition.x += distance;
            newPosition.y += distance;
            break;
        }

        // Validate new position
        if (!isValidPosition(draft, newPosition)) {
          // console.warn(`[MOVE_OBJECT] Invalid move position: (${newPosition.x}, ${newPosition.y})`);
          return state;
        }

        // Check walkability - bots can only move to walkable positions
        // console.log(`[MOVE_OBJECT] Bot ${id} trying to move from (${currentPos.x}, ${currentPos.y}) to (${newPosition.x}, ${newPosition.y})`);

        // Debug: Check what terrain is at the target position
        const topMostTerrain = getTopMostTerrainAtPosition(draft.groundLayer, newPosition);
        if (topMostTerrain) {
          // console.log(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) has terrain: ${topMostTerrain.type} (${topMostTerrain.id})`);
        } else {
          // console.log(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) has NO TERRAIN`);
        }

        // Check all terrain objects at this position (for debugging)
        const allTerrainAtPosition = draft.groundLayer.terrainObjectsByPosition.get(
          `${newPosition.x},${newPosition.y}`
        );
        if (allTerrainAtPosition && allTerrainAtPosition.length > 0) {
          // console.log(`[MOVE_OBJECT] All terrain at (${newPosition.x}, ${newPosition.y}):`, allTerrainAtPosition.map(t => `${t.type}(${t.id})`).join(', '));
        }

        if (!isWalkable(draft, newPosition)) {
          if (topMostTerrain) {
            // console.warn(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) is not walkable - terrain: ${topMostTerrain.type} (${topMostTerrain.id})`);
          } else {
            // console.warn(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) is not walkable - NO TERRAIN at this position`);
          }
          return state;
        }

        // console.log(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) is walkable, allowing movement`);

        // Check if target position is occupied by another object
        if (isPositionOccupied(draft, newPosition)) {
          console.warn(`Position (${newPosition.x}, ${newPosition.y}) is occupied`);
          return state;
        }

        // Remove from old position and place at new position
        removeObjectFromGrid(draft.grid, currentPos);
        object.position = newPosition;
        placeObjectInGrid(draft.grid, object, newPosition);
        break;
      }

      case 'SET_WORLD_SIZE': {
        const { width, height } = action.payload;

        // Create new grid with specified dimensions
        const newGrid = Array(height)
          .fill(null)
          .map(() => Array(width).fill(null));

        // Update dimensions and grid
        draft.width = width;
        draft.height = height;
        draft.grid = newGrid;

        // Clear any objects that are now outside bounds
        for (const [id, object] of draft.objects) {
          if (!isValidPosition(draft, object.position)) {
            draft.objects.delete(id);
          }
        }

        break;
      }

      case 'SET_SEED': {
        const { seed } = action.payload;
        draft.seed = seed;
        break;
      }

      case 'RESET_WORLD': {
        const newState = createWorldState(draft.seed);
        // Preserve dimensions if they've been customized
        newState.width = draft.width;
        newState.height = draft.height;
        newState.grid = Array(draft.height)
          .fill(null)
          .map(() => Array(draft.width).fill(null));

        // Replace entire state
        return newState;
      }

      default:
        return state;
    }
  });
}
